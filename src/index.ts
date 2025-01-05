/**
 * Index.ts
 * Combine all your re-exports and definitions here.
 */

// Step 1: Define runSourceIntegration near the top without `export`:
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
 * We remove `export` so removeExportsPlugin does NOT clip its code.
 */
async function runSourceIntegration(): Promise<void> {
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
      const ghMatch = ghPattern.exec(title);
      if (ghMatch) {
        taskInfo.sourceType = "github";
        if (ghMatch[1] === "ghissue") {
          taskInfo.itemType = "issue";
        } else if (ghMatch[1] === "ghpr") {
          taskInfo.itemType = "pr";
        } else if (ghMatch[1] === "ghgist") {
          taskInfo.itemType = "gist";
        }
        taskInfo.identifier = ghMatch[2];
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
      console.log("Source item is undefined (missing itemType?).");
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

// Attach it to globalThis so Drafts can call `runSourceIntegration()`:
globalThis.runSourceIntegration = runSourceIntegration;

// ====================
// Original re-exports
// ====================

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
export {
  executeSelectedTasksStep,
  selectTasksStep,
} from "./Actions/TaskActions/TodoistFlexibleFlow";

export {
  pickFutureDate,
  pickTimeForToday,
} from "./Actions/TaskActions/DateTimePrompts";

export { runBatchProcessAction } from "./Actions/BatchProcessAction";
export { runManageDraftWithPromptExecutor } from "./Actions/ManageDraftWithPromptExecutor";
export { runDailyDriverMenu } from "./Actions/TaskActions/DailyDriverMenu";

export {
  parseEphemeralJson,
  runDraftsActionExecutor,
} from "./executor/Executor";

export { runAiTextToCalendar } from "./Actions/AiTextToCalendar";
