import { log, showAlert } from "../helpers-utils";

/**
 * Interface for the global `draft` object in Drafts.
 * We add the `trash` method and other properties we might need.
 */
declare var draft: {
  content: string;
  uuid: string;
  isTrashed: boolean;
  trash(): void;
};

/**
 * Interface for the global `app` object in Drafts.
 * We add queueAction to chain calls to other actions.
 */
declare var app: {
  queueAction(action: any, draft: any): boolean;
};

declare class Action {
  static find(name: string): any;
}

/**
 * runDraftsActionExecutor()
 *
 * This script is designed to parse the current draft content as JSON,
 * find a `draftAction` by name, queue that action to run, and finally
 * trash the current draft, treating it as ephemeral data storage.
 *
 * Example usage from outside of Drafts:
 *
 *   drafts://x-callback-url/create?text={"draftAction":"SomeActionName","params":{"key":"value"}}&action=Drafts%20Action%20Executor
 *
 * This will create a new draft containing the JSON above, automatically run this script,
 * and trash the draft after queueing the specified action. The queued action can read
 * from `draft.getTemplateTag("...")` or other structures if desired.
 */
export async function runDraftsActionExecutor(): Promise<void> {
  try {
    log("[DraftActionExecutor] Starting runDraftsActionExecutor...");
    // Attempt to parse draft content as JSON
    log("[DraftActionExecutor] Ephemeral draft content:\n" + draft.content);
    const jsonData = JSON.parse(draft.content.trim());
    log("[DraftActionExecutor] Parsed JSON:", false);
    log(JSON.stringify(jsonData), false);
    const actionName = jsonData.draftAction;
    log("[DraftActionExecutor] actionName: " + (actionName || "undefined"));

    if (!actionName) {
      showAlert(
        "No Action Provided",
        "Please provide 'draftAction' in the JSON."
      );
      return;
    }

    const actionToQueue = Action.find(actionName);
    if (!actionToQueue) {
      showAlert(
        "Action Not Found",
        `Could not find an action named: "${actionName}"`
      );
      return;
    }

    // Optionally, you might store custom parameters in template tags
    // for the queued action to read, for example:
    if (jsonData.params) {
      log(
        "[DraftActionExecutor] Found params. Storing in template tag 'CustomParams'."
      );
      draft.setTemplateTag("CustomParams", JSON.stringify(jsonData.params));
    } else {
      log("[DraftActionExecutor] No params object found in JSON.");
    }

    // Queue the found action to run after this script completes
    log("[DraftActionExecutor] Queuing action: " + actionName);
    const success = app.queueAction(actionToQueue, draft);
    if (!success) {
      log(`Failed to queue action "${actionName}".`, true);
    } else {
      log(`Queued action "${actionName}" successfully.`);
    }
  } catch (error) {
    log(`Error in runDraftsActionExecutor: ${String(error)}`, true);
  } finally {
    // Trash the draft to keep it ephemeral
    if (!draft.isTrashed) {
      draft.trash();
      log("Trashed ephemeral draft.");
    }
  }
}
