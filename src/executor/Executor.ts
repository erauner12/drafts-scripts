import { log, showAlert } from "../helpers/helpers-utils";

/**
 * Executor: Central place for ephemeral JSON logic or
 * "first-class" action queueing.
 *
 * This module can be extended with more convenience methods if desired,
 * such as queueJsonAction(...) or parseJsonDraft(...).
 */

/**
 * parseEphemeralJson
 *
 * Attempt to parse ephemeral JSON from draft.content, or fallback from ExecutorData.
 * @returns {object} the parsed data or empty object
 */
export function parseEphemeralJson(): any {
  let jsonData: any = {};
  let usedEphemeral = false;

  // Attempt ephemeral JSON in draft content
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
    log(
      "[Executor] No valid ephemeral JSON found in draft.content, continuing..."
    );
  }

  // If not ephemeral, check fallback
  if (!usedEphemeral) {
    const fallbackData = draft.getTemplateTag("ExecutorData");
    if (fallbackData) {
      log("[Executor] Found fallback JSON in 'ExecutorData' tag.");
      try {
        const parsedFallback = JSON.parse(fallbackData);
        Object.assign(jsonData, parsedFallback);
      } catch {
        log(
          "[Executor] Could not parse fallback JSON from ExecutorData.",
          true
        );
      }
    }
  }
  return jsonData;
}

/**
 * runDraftsActionExecutor
 *
 * Takes ephemeral or fallback JSON, finds `draftAction`, queues it,
 * and trashes the ephemeral draft.
 */
export async function runDraftsActionExecutor(): Promise<void> {
  if (draft.hasTag("status::processed")) {
    log(
      "[Executor] Ephemeral draft has 'status::processed'; skipping re-processing."
    );
    return;
  }

  try {
    log("[Executor] Starting runDraftsActionExecutor...");
    log("[Executor] Ephemeral draft content:\n" + draft.content);

    let jsonData = parseEphemeralJson();

    // If no draftAction, prompt user
    if (!jsonData.draftAction) {
      log("[Executor] No 'draftAction' found in ephemeral/fallback JSON.");
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
      // Let user choose an action
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

      const success2 = app.queueAction(fallbackAction, draft);
      if (!success2) {
        log(`Failed to queue fallback action "${chosenActionName}".`, true);
      } else {
        log(`Queued fallback action "${chosenActionName}" successfully.`);
      }
      return;
    }

    log(
      "[Executor] Parsed ephemeral JSON:\n" + JSON.stringify(jsonData, null, 2)
    );
    const actionName = jsonData.draftAction;
    log("[Executor] actionName: " + (actionName || "undefined"));

    if (!actionName) {
      showAlert(
        "No Action Provided",
        "Please provide 'draftAction' in the JSON."
      );
      return;
    }

    // Potentially create a new draft from jsonData.draftData
    let realDraft: Draft | null = null;
    if (jsonData.draftData) {
      log("[Executor] Found draftData. Creating a new real draft...");
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
      log("[Executor] Created new real draft, UUID = " + realDraft.uuid);
    } else {
      log("[Executor] No draftData in ephemeral JSON.");
    }

    let draftForAction = realDraft || draft;

    // If we have 'params', store them in CustomParams
    if (jsonData.params) {
      log("[Executor] Found params. Storing in 'CustomParams' tag on draft.");
      draftForAction.setTemplateTag(
        "CustomParams",
        JSON.stringify(jsonData.params)
      );
    }

    // Find & queue the action
    const actionToQueue = Action.find(actionName);
    if (!actionToQueue) {
      showAlert(
        "Action Not Found",
        `Could not find an action named: "${actionName}"`
      );
      return;
    }
    log(
      "[Executor] Queuing action: " +
        actionName +
        " on draft: " +
        draftForAction.uuid
    );
    const success = app.queueAction(actionToQueue, draftForAction);
    if (!success) {
      log(`Failed to queue action "${actionName}".`, true);
    } else {
      log(`Queued action "${actionName}" successfully.`);
      draft.addTag("status::processed");
      draft.update();
    }
  } catch (error) {
    log(`[Executor] Error in runDraftsActionExecutor: ${String(error)}`, true);
  } finally {
    // Trash ephemeral draft
    if (!draft.isTrashed) {
      draft.trash();
      log("Trashed ephemeral JSON draft (UUID: " + draft.uuid + ").");
    }
  }
}

/**
 * queueJsonAction
 *
 * Example convenience method to queue ephemeral JSON from code,
 * so you don't have to manually set draft.content or ExecutorData.
 *
 * @param jsonData the ephemeral data, including a 'draftAction'
 * @param skipTrashing if true, skip trashing the ephemeral draft
 */
export function queueJsonAction(
  jsonData: any,
  skipTrashing: boolean = false
): void {
  // Convert to string
  const ephemeralContent = JSON.stringify(jsonData);

  // Overwrite draft content or set ExecutorData?
  // For demonstration, let's set draft content:
  draft.content = ephemeralContent;
  draft.update();
  log(
    `[Executor] queueJsonAction wrote ephemeral JSON to draft:\n${ephemeralContent}`
  );

  // Now queue the "Drafts Action Executor"
  const executorAction = Action.find("Drafts Action Executor");
  if (!executorAction) {
    showAlert(
      "Executor Not Found",
      "Unable to locate 'Drafts Action Executor'."
    );
    return;
  }

  const success = app.queueAction(executorAction, draft);
  if (!success) {
    log(
      "[Executor] Failed to queue Drafts Action Executor with ephemeral JSON",
      true
    );
  } else {
    log("[Executor] Successfully queued ephemeral JSON via queueJsonAction().");
    if (!skipTrashing) {
      // We'll rely on runDraftsActionExecutor to do the final trash
    }
  }
}