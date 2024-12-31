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
