import { log, showAlert } from "../helpers-utils";

declare var draft: {
  setTemplateTag(key: string, value: string): void;
};
declare var app: {
  queueAction(action: any, draft: any): boolean;
};
declare class Action {
  static find(name: string): any;
}

export function runBatchProcessAction() {
  // First, let's see if there's ANY ephemeral JSON in the current draft (just for logging).
  const currentDraftContent = draft.content.trim();
  if (!currentDraftContent) {
    log(
      "[BatchProcessAction] Current draft is empty. No ephemeral JSON found. That's okay, we'll rely on fallback data."
    );
  } else {
    // Try to parse the ephemeral JSON just for logging sake
    try {
      const ephemeralObj = JSON.parse(currentDraftContent);
      if (ephemeralObj && ephemeralObj.draftAction) {
        log(
          "[BatchProcessAction] Detected ephemeral JSON with draftAction: " +
            ephemeralObj.draftAction
        );
      } else {
        log(
          "[BatchProcessAction] Detected ephemeral JSON, but no 'draftAction' key."
        );
      }
    } catch (e) {
      log(
        "[BatchProcessAction] Draft content is not valid JSON, continuing with fallback approach..."
      );
    }
  }

  // For demonstration, let's collect a hypothetical set of items:
  const itemsToProcess = [
    { itemId: "Item-1", data: { note: "First item" } },
    { itemId: "Item-2", data: { note: "Second item" } },
  ];

  // We'll instruct the Drafts Action Executor to run "MyActionName"
  const fallbackJson = {
    draftAction: "MyActionName",
    params: {
      items: itemsToProcess,
    },
  };

  // Store this fallback JSON in a template tag
  draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackJson));
  log("[BatchProcessAction] Set ExecutorData with items to process.");

  // Now queue the Drafts Action Executor
  const executorAction = Action.find("Drafts Action Executor");
  if (!executorAction) {
    showAlert(
      "Executor Not Found",
      "Unable to locate 'Drafts Action Executor'."
    );
    return;
  }

  const success = app.queueAction(executorAction, draft);
  if (success) {
    log("[BatchProcessAction] Successfully queued Drafts Action Executor.");
  } else {
    log("[BatchProcessAction] Failed to queue Drafts Action Executor.", true);
  }
}
