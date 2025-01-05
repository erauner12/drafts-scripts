/**
 * Index.ts
 * Combine all your re-exports and definitions here.
 */
import { GitHubItem } from "./Actions/SourceIntegration/GitHubItem";
import { JiraIssue } from "./Actions/SourceIntegration/JiraIssue";
import { SourceActionRegistry } from "./Actions/SourceIntegration/SourceActionRegistry";
import { SourceItem } from "./Actions/SourceIntegration/SourceItem";
import { TodoistTask } from "./Actions/SourceIntegration/TodoistTask";
import { cancelAction } from "./helpers/CommonFlowUtils";




declare var app: App;
declare var editor: Editor;
declare var draft: Draft;
declare var script: Script;

/**
 * FallbackSourceItem
 * Because SourceItem is abstract, we need a concrete subclass for fallback usage.
 */
class FallbackSourceItem extends SourceItem {
  public async performAction(): Promise<void> {
    console.log(
      "[FallbackSourceItem] No recognized source type. Nothing to do."
    );
    app.displayInfoMessage("Fallback: no recognized source item found.");
  }
}

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
    console.log(`[SourceIntegration] Draft title: "${title}"`);
    console.log(
      `[SourceIntegration] Selected text length: ${
        selectedText ? selectedText.length : 0
      }`
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
        "[SourceIntegration] No recognized pattern for Todoist/Jira. Checking GitHub pattern..."
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

    // At this point, taskInfo.sourceType might be null if we didn't match anything
    if (!taskInfo.sourceType) {
      console.log(
        "[SourceIntegration] No recognized source type. We'll fallback."
      );
    } else {
      console.log(
        "[SourceIntegration] Detected sourceType:",
        taskInfo.sourceType
      );
    }

    // Prepare a SourceItem if the source type + identifier is valid
    let sourceItem: SourceItem;
    if (taskInfo.sourceType && taskInfo.identifier) {
      switch (taskInfo.sourceType) {
        case "todoist":
          sourceItem = new TodoistTask(
            draft,
            selectedText!,
            taskInfo.identifier
          );
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
          } else {
            // fallback if itemType missing
            sourceItem = new FallbackSourceItem(draft, selectedText!);
          }
          break;
        default:
          // fallback if unknown
          sourceItem = new FallbackSourceItem(draft, selectedText!);
          break;
      }
    } else {
      // fallback if no recognized pattern
      sourceItem = new FallbackSourceItem(draft, selectedText!);
    }

    // If we have a recognized sourceType, gather actions from the registry
    let actionsToShow =
      taskInfo.sourceType && SourceActionRegistry[taskInfo.sourceType]
        ? SourceActionRegistry[taskInfo.sourceType]
        : [];

    // If none found or empty, use fallback from registry
    if (!actionsToShow || actionsToShow.length === 0) {
      console.log("[SourceIntegration] Using fallback actions from registry.");
      actionsToShow = SourceActionRegistry.fallback;
    }

    // Convert the array of ActionItems into a Prompt
    const p = new Prompt();
    p.title = "Available Actions";
    for (const item of actionsToShow) {
      p.addButton(item.label);
    }
    p.addButton("Cancel");
    const didShow = p.show();
    if (!didShow || p.buttonPressed === "Cancel") {
      console.log("[SourceIntegration] User canceled the actions prompt.");
      cancelAction("User canceled the prompt");
      return;
    }

    // The user pressed some action label
    const chosenLabel = p.buttonPressed;
    const chosenAction = actionsToShow.find((a) => a.label === chosenLabel);
    if (!chosenAction) {
      console.log("[SourceIntegration] No matching action found. Exiting.");
      cancelAction("No recognized action from prompt");
      return;
    }

    console.log("[SourceIntegration] Running chosen action:", chosenLabel);
    // Since sourceItem must exist, we can safely do:
    await chosenAction.run(sourceItem);
  } catch (error) {
    console.error("Error in runSourceIntegration main script:", error);
    app.displayErrorMessage("An unexpected error occurred.");
  } finally {
    console.log("SourceIntegration: script completed.");
    script.complete();
  }
}

// Attach it to globalThis so Drafts can call `runSourceIntegration()`:
(globalThis as any).runSourceIntegration = runSourceIntegration;

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
