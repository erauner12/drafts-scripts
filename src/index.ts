export {
  copyLineDown,
  copyLineToClipboard,
  copyLineUp,
  cutLine,
  deleteLine,
} from "./actions-editing-copycutdelete";

export {
  selectAll,
  selectLine,
  selectParagraph,
  selectResponse,
} from "./actions-editing-selection";

export { insertDictation, pasteClipboard } from "./actions-editing-utils";

export {
  jumpToNextHeader,
  jumpToPreviousHeader,
  moveCursorLeft,
  moveCursorRight,
} from "./actions-navigation";

export {
  highlightBold,
  highlightCode,
  highlightCodeBlock,
  highlightItalic,
} from "./actions-markdown-highlighting";

export {
  insertMarkdownImage,
  insertMarkdownLink,
} from "./actions-markdown-links";

export { linebreakKeepIndentation as linebreakWithinList } from "./actions-markdown-lists";

export {
  toggleMarkdownCheckboxes,
  toggleMarkdownTasks,
} from "./actions-markdown-tasks";

export {
  capitalize,
  removeExtraWhitespace,
  removeWhitespace,
  replaceWhitespace,
  sortLines,
  toCamelCase,
  toHyphenCase,
  toLowerCaseCustom,
  toMemeCase,
  toPascalCase,
  toSnakeCase,
  toTitleCase,
  toUpperCaseCustom,
  trimWhitespace,
} from "./actions-transform-case";

export {
  evaluateMathExpression,
  max,
  mean,
  min,
  product,
  sum,
} from "./actions-transform-math";

export { copyAllTagsToClipboard } from "./actions-shortcuts";



export { runTodoistEnhancedMenu } from "./Actions/TaskActions/TodoistEnhancedMenu";

// New flexible flow approach
export {
  executeSelectedTasksStep,
  selectTasksStep,
} from "./Actions/TaskActions/TodoistFlexibleFlow";


/**
 * Re-export date/time prompt utility functions:
 *
 * pickTimeForToday():
 *   Prompts the user to select a time (morning, noon, evening, or custom) and returns
 *   a string describing how the task should be scheduled for today (e.g., "today at 9am").
 *
 * pickFutureDate():
 *   Prompts the user to select a date in the future (or tomorrow, next week, etc.)
 *   and returns an object containing either { due_string: string } or { due_date: string },
 *   depending on the user selection.
 */
export {
  pickFutureDate,
  pickTimeForToday,
} from "./Actions/TaskActions/DateTimePrompts";

export { runDailyDriverMenu } from "./Actions/TaskActions/DailyDriverMenu";

// Executor for JSON-based ephemeral drafts
export { runBatchProcessAction } from "./Actions/BatchProcessAction";
// export { runMyActionName } from "./Actions/MyActionName";

export { runManageDraftWithPromptExecutor } from "./Actions/ManageDraftWithPromptExecutor";

export {
  parseEphemeralJson,
  runDraftsActionExecutor,
} from "./executor/Executor";

/** Add the new AiTextToCalendar action */
export { runAiTextToCalendar } from "./Actions/AiTextToCalendar";

// ---- [Inline runSourceIntegration] ----

import { GitHubItem } from "./Actions/SourceIntegration/GitHubItem";
import { JiraIssue } from "./Actions/SourceIntegration/JiraIssue";
import { SourceItem } from "./Actions/SourceIntegration/SourceItem";
import { TodoistTask } from "./Actions/SourceIntegration/TodoistTask";
import { cancelAction } from "./helpers/CommonFlowUtils";

declare var app: App;
declare var editor: Editor;
declare var draft: Draft;
declare var script: Script;

/**
 * runSourceIntegration
 *
 * Replaces the separate index.ts in ./Actions/SourceIntegration.
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
    console.log("Selected text length:", selectedText ? selectedText.length : 0);

    interface ITaskInfo {
      sourceType: string | null;
      identifier: string | null;
      itemType?: string;
    }
    const taskInfo: ITaskInfo = {
      sourceType: null,
      identifier: null,
    };

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
      console.log("Draft title does not match known patterns. Attempting GitHub...");
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
  } finally {
    console.log("SourceIntegration: script completed.");
    script.complete();
  }
}

// ---- [End of runSourceIntegration code] ----

// // Re-export the new example
// export {
//   exampleUsingLodash,
//   exampleUsingMyCoolLib,
// } from "./ExampleUsingLodash";
// export { exampleUsingMyLegacyLib } from "./ExampleUsingMyLegacyLib";
// export { runPlainJsExample } from "./ExampleUsingPlainJs";


