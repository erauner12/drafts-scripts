import { cancelAction } from "../../helpers/CommonFlowUtils";
import { GitHubItem } from "./GitHubItem";
import { JiraIssue } from "./JiraIssue";
import { SourceItem } from "./SourceItem";
import { TodoistTask } from "./TodoistTask";

declare var app: App;
declare var editor: Editor;
declare var draft: Draft;
declare var script: Script;

/**
 * runSourceIntegration
 *
 * This function replicates the "main script logic" originally in SourceIntegration.ts.
 * It identifies the source type from the draft title, instantiates the correct class,
 * and calls performAction() on it.
 *
 * Usage in Drafts:
 *    require("custom-scripts/drafts-actions.js");
 *    runSourceIntegration();
 */
export async function runSourceIntegration(): Promise<void> {
  try {
    console.log("SourceIntegration: script started.");
    const title = draft.title;
    let selectedText = editor.getSelectedText();
    if (!selectedText) {
      const range = editor.getSelectedLineRange();
      selectedText = editor.getTextInRange(range[0], range[1]);
    }

    console.log("Draft title:", title);
    console.log(
      "Selected text length:",
      selectedText ? selectedText.length : 0
    );

    interface ITaskInfo {
      sourceType: string | null;
      identifier: string | null;
      itemType?: string;
    }
    const taskInfo: ITaskInfo = {
      sourceType: null,
      identifier: null,
    };

    // Patterns for known sources
    const patterns = {
      todoist: /^task_(\d+)$/,
      jira: /^issue_([A-Z]+-\d+)$/,
    };

    if (!title || title.trim() === "") {
      console.log("Draft title is empty or undefined.");
      app.displayWarningMessage("Draft title is missing.");
      cancelAction("No recognized patterns found");
      return;
    }

    // Check for todoist or jira
    if (patterns.todoist.test(title)) {
      taskInfo.sourceType = "todoist";
      const match = title.match(patterns.todoist);
      taskInfo.identifier = match ? match[1] : null;
      console.log("Source type identified as Todoist:", taskInfo.identifier);
    } else if (patterns.jira.test(title)) {
      taskInfo.sourceType = "jira";
      const match = title.match(patterns.jira);
      taskInfo.identifier = match ? match[1] : null;
      console.log("Source type identified as Jira:", taskInfo.identifier);
    } else {
      console.log(
        "Draft title does not match known patterns. Attempting GitHub..."
      );
      // GitHub pattern approach
      const ghPattern = /^(ghissue|ghpr|ghgist)_(.*)$/;
      const match = ghPattern.exec(title);
      if (match) {
        taskInfo.sourceType = "github";
        if (match[1] === "ghissue") {
          taskInfo.itemType = "issue";
        } else if (match[1] === "ghpr") {
          taskInfo.itemType = "pr";
        } else if (match[1] === "ghgist") {
          taskInfo.itemType = "gist";
        }
        taskInfo.identifier = match[2];
        console.log(
          `Source type identified as GitHub: itemType=${taskInfo.itemType}, identifier=${taskInfo.identifier}`
        );
      }
    }

    if (!taskInfo.sourceType || !taskInfo.identifier) {
      app.displayWarningMessage(
        "This draft is not linked to a recognized task/issue."
      );
      cancelAction("No recognized patterns found");
      return;
    }

    let sourceItem: SourceItem | undefined;
    switch (taskInfo.sourceType) {
      case "todoist":
        sourceItem = new TodoistTask(draft, selectedText!, taskInfo.identifier);
        break;
      case "jira":
        sourceItem = new JiraIssue(draft, selectedText!, taskInfo.identifier);
        break;
      case "github":
        if (taskInfo.itemType) {
          sourceItem = new GitHubItem(
            draft,
            selectedText!,
            taskInfo.identifier,
            taskInfo.itemType
          );
        }
        break;
      default:
        console.log("Unknown source type.");
        app.displayWarningMessage("Unable to process the draft.");
        cancelAction("No recognized patterns found");
        return;
    }

    if (sourceItem) {
      console.log(
        "Performing action for source item of type:",
        taskInfo.sourceType
      );
      await sourceItem.performAction();
    } else {
      console.log("Source item is undefined (possibly missing itemType?).");
      app.displayWarningMessage("Unable to process the draft.");
      cancelAction("User canceled the prompt");
    }
  } catch (error) {
    console.error("Error in runSourceIntegration main script:", error);
    app.displayErrorMessage("An unexpected error occurred.");
    // We reuse failAction logic or cancel, but let's just do a console log here for clarity.
  } finally {
    console.log("SourceIntegration: script completed.");
    script.complete();
  }
}
