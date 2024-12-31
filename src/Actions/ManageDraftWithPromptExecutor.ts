import { log, showAlert } from "../helpers-utils";

/**
 * We'll assume "draft", "editor", "app", and "script" are globally available, as in Drafts.
 * This file extends the idea of "manageDraftWithPrompt" by optionally leveraging the
 * DraftActionExecutor flow (with ephemeral data or fallback).
 */

declare var draft: Draft;
declare var editor: {
  load(d: Draft): void;
};
declare var app: {
  currentWorkspace: {
    query(filter: string): Draft[];
  };
  displayInfoMessage(message: string): void;
  queueAction(a: any, d: Draft): boolean;
};
declare var script: {
  complete(): void;
};

declare class Prompt {
  title: string;
  message: string;
  buttonPressed: string;
  fieldValues: { [key: string]: any };

  addButton(title: string): void;
  show(): boolean;
}

interface Draft {
  uuid: string;
  content: string;
  isTrashed: boolean;
  isArchived: boolean;
  isFlagged: boolean;
  title: string;
  update(): void;
  toJSON(): object;
  addTag(tag: string): void;
  setTemplateTag(tag: string, value: string): void;
  getTemplateTag(tag: string): string | null;
}

/**
 * Example action which uses manageDraftWithPrompt-like logic
 * and optionally spawns the Drafts Action Executor with the current draft
 * so it can be processed by another action in your system.
 */
export async function runManageDraftWithPromptExecutor(): Promise<void> {
  if (!draft) {
    log("[ManageDraftWithPromptExecutor] No draft available!");
    script.complete();
    return;
  }

  const p = new Prompt();
  p.title = "Manage Draft via Executor?";
  p.message = "Choose how you'd like to handle this draft:";
  p.addButton("Manage with Prompt");
  p.addButton("Queue Executor for Another Action");
  p.addButton("Cancel");

  if (!p.show() || p.buttonPressed === "Cancel") {
    log("[ManageDraftWithPromptExecutor] User canceled.");
    script.complete();
    return;
  }

  if (p.buttonPressed === "Manage with Prompt") {
    log(
      "[ManageDraftWithPromptExecutor] Redirecting to local manageDraftWithPrompt logic..."
    );
    // You might import or call your function runManageDraftWithPrompt() here
    await localManageDraftWithPrompt(draft);
    script.complete();
    return;
  }

  if (p.buttonPressed === "Queue Executor for Another Action") {
    // We demonstrate how you might gather ephemeral JSON with some default data.
    // Then rely on the DraftActionExecutor to parse it and queue your real action.
    const fallbackJson = {
      draftAction: "MyActionName", // the action you want to call after the Executor
      // pass essential fields. Possibly use draft.toJSON() or a subset of fields
      params: {
        fromManageDraftPrompt: true,
        draftUUID: draft.uuid,
        draftContent: draft.content,
      },
    };

    // Store in ExecutorData
    draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackJson));

    // Now queue "Drafts Action Executor" which will parse ephemeral JSON or fallback
    const executor = Action.find("Drafts Action Executor");
    if (!executor) {
      showAlert(
        "Executor Not Found",
        "Unable to locate 'Drafts Action Executor'."
      );
      script.complete();
      return;
    }

    const success = app.queueAction(executor, draft);
    if (!success) {
      log(
        "[ManageDraftWithPromptExecutor] Failed to queue Drafts Action Executor!",
        true
      );
    } else {
      log(
        "[ManageDraftWithPromptExecutor] Successfully queued Drafts Action Executor."
      );
    }
    script.complete();
    return;
  }
}

/**
 * This is a minimal inlined version of your manageDraftWithPrompt logic,
 * just for demonstration. If you already have it in ManageDraftWithPrompt.ts,
 * then we can call that function directly.
 */
async function localManageDraftWithPrompt(d: Draft): Promise<void> {
  // Do minimal logic or import from your existing code
  log("[localManageDraftWithPrompt] Starting...");
  // Example: just show a prompt
  const localPrompt = new Prompt();
  localPrompt.title = "Local Draft Prompt";
  localPrompt.message = `Draft Title: "${d.title}"\nDraft UUID: ${d.uuid}`;
  localPrompt.addButton("OK");
  localPrompt.addButton("Cancel");
  if (!localPrompt.show()) {
    log("[localManageDraftWithPrompt] User canceled.");
    return;
  }
  log(
    "[localManageDraftWithPrompt] User pressed: " + localPrompt.buttonPressed
  );

  // Suppose we do an inline "delete" for demonstration
  if (localPrompt.buttonPressed === "OK") {
    d.isTrashed = true;
    d.update();
    log("[localManageDraftWithPrompt] Draft moved to trash.");
  }
}
