import { log, showAlert } from "../helpers-utils";

// We assume the global 'draft' and 'app' objects exist in Drafts:
declare var draft: {
  setTemplateTag(key: string, value: string): void;
};
declare var app: {
  queueAction(action: any, draft: any): boolean;
};
declare class Action {
  static find(name: string): any;
}

/**
 * This sample action demonstrates how to pass multiple Todoist tasks
 * to the Drafts Action Executor via fallback JSON. Suppose we have
 * a set of tasks we want to handle with "MyActionName" or some other
 * custom action in Drafts.
 */
export function runBatchProcessTodoistAction() {
  // Example set of Todoist tasks we might fetch from a custom script
  // In a real scenario, you might have code that queries the Todoist API.
  const todoistTasks = [
    { id: 12345, content: "Todoist Task #1" },
    { id: 67890, content: "Todoist Task #2", due: { date: "2025-01-01" } },
  ];

  // We want to pass them to "MyActionName" (or any other action).
  // The Executor can read "draftAction" plus "params" or "todoistItems" etc.
  const fallbackJson = {
    draftAction: "MyActionName", // You could also queue a different action name
    params: {
      tasks: todoistTasks,
      source: "BatchProcessTodoistAction",
    },
  };

  // Write this to the fallback tag
  draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackJson));
  log("[BatchProcessTodoistAction] Wrote fallback JSON to ExecutorData tag.");

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
  if (success) {
    log(
      "[BatchProcessTodoistAction] Successfully queued Drafts Action Executor."
    );
  } else {
    log(
      "[BatchProcessTodoistAction] Failed to queue Drafts Action Executor.",
      true
    );
  }
}
