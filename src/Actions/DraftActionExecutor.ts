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
  getTemplateTag(tag: string): string | null;
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
  // If ephemeral draft is already processed, skip
  if (draft.hasTag("status::processed")) {
    log(
      "[DraftActionExecutor] Ephemeral draft has 'status::processed'; skipping re-processing."
    );
    return;
  }

  try {
    log("[DraftActionExecutor] Starting runDraftsActionExecutor...");

    // Log the entire content in case we need debugging
    log("[DraftActionExecutor] Ephemeral draft content:\n" + draft.content);

    // STEP 1: Attempt ephemeral JSON
    let jsonData: any = {};
    let usedEphemeral = false;
    try {
      const parsed = JSON.parse(draft.content.trim());
      if (parsed && parsed.draftAction) {
        jsonData = parsed;
        usedEphemeral = true;
        log(
          "[Executor] Found ephemeral JSON with action: " + jsonData.draftAction
        );
      }
    } catch {
      log("[Executor] No valid ephemeral JSON found, continuing...");
    }

    // STEP 2: Fallback to template tag if needed
    if (!usedEphemeral) {
      const fallbackData = draft.getTemplateTag("ExecutorData");
      if (fallbackData) {
        log("[Executor] Found fallback JSON in 'ExecutorData' tag.");
        try {
          const parsedFallback = JSON.parse(fallbackData);
          Object.assign(jsonData, parsedFallback);
        } catch {
          log("[Executor] Could not parse fallback JSON.", true);
        }
      }
    }

    // STEP 3: If still no action, fall back to the currently loaded draft in the editor
    if (!jsonData.draftAction) {
      log("[Executor] No 'draftAction' found in ephemeral/fallback JSON.");

      // We'll prompt the user for how they'd like to proceed with the loaded draft.
      // If you prefer a silent fallback, you can remove the prompt and auto-run some default logic.
      const p = new Prompt();
      p.title = "No draftAction Found";
      p.message =
        "Would you like to pick an action to run on the currently loaded draft in the editor?";
      p.addButton("Pick Action");
      p.addButton("Cancel");
      if (!p.show() || p.buttonPressed === "Cancel") {
        log("[Executor] User canceled or no ephemeral JSON. Exiting.");
        return;
      }

      // Suppose we let user pick from a short list of known actions:
      const actionPrompt = new Prompt();
      actionPrompt.title = "Select Action";
      actionPrompt.message = "Choose an action to run on this draft:";
      actionPrompt.addButton("MyActionName");
      actionPrompt.addButton("BatchProcessAction");
      actionPrompt.addButton("Cancel");
      if (!actionPrompt.show() || actionPrompt.buttonPressed === "Cancel") {
        log("[Executor] User canceled second prompt. Exiting.");
        return;
      }

      // Now we have an action name from the user
      const chosenActionName = actionPrompt.buttonPressed;
      log("[Executor] User selected fallback action: " + chosenActionName);

      const fallbackAction = Action.find(chosenActionName);
      if (!fallbackAction) {
        showAlert(
          "Action Not Found",
          `Could not find an action named: "${chosenActionName}"`
        );
        return;
      }

      // We'll queue that action on the current ephemeral draft (or the editor's loaded draft).
      // If you'd rather run it on a new draft, or load from a workspace, do so here.
      const success = app.queueAction(fallbackAction, draft);
      if (!success) {
        log(`Failed to queue fallback action "${chosenActionName}".`, true);
      } else {
        log(`Queued fallback action "${chosenActionName}" successfully.`);
      }
      return;
    }

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

    // If we have jsonData.draftData, create a new draft:
    let realDraft: Draft | null = null;

    if (jsonData.draftData) {
      log(
        "[DraftActionExecutor] Found draftData. Creating a new draft with that data..."
      );
      realDraft = Draft.create();
      if (typeof jsonData.draftData.content === "string") {
        realDraft.content = jsonData.draftData.content;
      }
      if (jsonData.draftData.title) {
        realDraft.addTag("title:" + jsonData.draftData.title);
      }
      if (jsonData.draftData.flagged === true) {
        realDraft.isFlagged = true;
      }
      realDraft.setTemplateTag("DraftData", JSON.stringify(jsonData.draftData));
      realDraft.update();
      log(
        "[DraftActionExecutor] Created a new real draft. UUID = " +
          realDraft.uuid
      );
    } else {
      log("[DraftActionExecutor] No draftData object found in JSON.");
    }

    // Decide which draft to queue the action on:
    let draftForAction = realDraft || draft;

    // If params exist, store them on draftForAction:
    if (jsonData.params) {
      log(
        "[DraftActionExecutor] Found params. Storing in template tag 'CustomParams'."
      );
      draftForAction.setTemplateTag(
        "CustomParams",
        JSON.stringify(jsonData.params)
      );
    } else {
      log("[DraftActionExecutor] No params object found in JSON.");
    }

    const actionToQueue = Action.find(actionName);
    if (!actionToQueue) {
      showAlert(
        "Action Not Found",
        `Could not find an action named: "${actionName}"`
      );
      return;
    }

    log(
      "[DraftActionExecutor] Queuing action on draft: " + draftForAction.uuid
    );
    const success = app.queueAction(actionToQueue, draftForAction);
    if (!success) {
      log(`Failed to queue action "${actionName}".`, true);
    } else {
      log(`Queued action "${actionName}" successfully.`);

      // Mark the ephemeral draft as processed
      draft.addTag("status::processed");
      draft.update();
    }
  } catch (error) {
    log(`Error in runDraftsActionExecutor: ${String(error)}`, true);
  } finally {
    // Trash the draft to keep it ephemeral
    if (!draft.isTrashed) {
      draft.trash();
      log("Trashed the ephemeral JSON draft (UUID: " + draft.uuid + ").");
    }
  }
}
