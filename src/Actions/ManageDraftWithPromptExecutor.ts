// ManageDraftWithPromptExecutor.ts
//
// This script demonstrates an "orchestrator" approach, bridging the loaded editor draft
// with a user prompt to queue actions or do immediate archive/trash operations. It does
// not automatically load the next draft. The user can simply open the next draft (via
// keyboard shortcut, search, or selecting from the workspace) and rerun the script.
//
// Usage:
//  1) Assign a keyboard shortcut to "ManageDraftWithPromptExecutor" to quickly run it on
//     whichever draft is loaded in the editor.
//  2) The prompt will offer actions to queue (which can be ephemeral or fallback-based),
//     or to do simpler tasks like "Archive" or "Trash."

import { log, showAlert } from "../helpers-utils";

declare var draft: Draft;
declare var app: {
  queueAction(action: any, d: Draft): boolean;
  currentWorkspace: {
    query(filter: string): Draft[];
  };
  displayInfoMessage(msg: string): void;
};
declare var editor: {
  load(d: Draft): void;
};
declare var script: {
  complete(): void;
};
declare class Action {
  static find(name: string): any;
}
interface Draft {
  uuid: string;
  content: string;
  isTrashed: boolean;
  isArchived: boolean;
  isFlagged: boolean;
  tags: string[];
  title: string;
  update(): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  setTemplateTag(t: string, v: string): void;
  hasTag(tag: string): boolean;
}

declare class Prompt {
  title: string;
  message: string;
  buttonPressed: string;
  fieldValues: { [key: string]: any };
  addButton(title: string): void;
  show(): boolean;
}

/**
 * runManageDraftWithPromptExecutor()
 *
 * Presents a menu of possible actions for the currently loaded draft, bridging
 * direct manipulations (like archive, trash, tags) with the possibility of
 * queueing an action in the DraftActionExecutor system.
 *
 * Does NOT automatically load the next draft. Instead, the user can open the next
 * draft as they prefer (keyboard shortcut, workspace list, etc.) and rerun this script.
 */
export async function runManageDraftWithPromptExecutor(): Promise<void> {
  if (!draft) {
    log("[ManageDraftWithPromptExecutor] No loaded draft found!");
    script.complete();
    return;
  }

  log(
    `[ManageDraftWithPromptExecutor] Acting on draft: "${draft.title}" (uuid: ${draft.uuid})`
  );

  // Construct a prompt for user to pick how they'd like to handle this draft
  const mainPrompt = new Prompt();
  mainPrompt.title = "Manage Draft";
  mainPrompt.message = `Currently loaded draft:\n"${
    draft.title
  }"\n\nContent Preview:\n${draft.content.slice(0, 100)}\n...`;

  // Possible local actions
  mainPrompt.addButton("Archive Draft");
  mainPrompt.addButton("Trash Draft");
  mainPrompt.addButton("Toggle Flag");
  // Possibly queue an external action (like MyActionName, or other actions)
  mainPrompt.addButton("Queue: MyActionName");
  mainPrompt.addButton("Queue: BatchProcessAction");
  mainPrompt.addButton("Cancel");

  if (!mainPrompt.show() || mainPrompt.buttonPressed === "Cancel") {
    log(
      "[ManageDraftWithPromptExecutor] Prompt cancelled or user chose Cancel."
    );
    script.complete();
    return;
  }

  const choice = mainPrompt.buttonPressed;
  log(`[ManageDraftWithPromptExecutor] User selected: ${choice}`);

  switch (choice) {
    case "Archive Draft":
      if (draft.isArchived) {
        app.displayInfoMessage("Draft already in archive.");
      } else {
        draft.isArchived = true;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Draft archived: ${draft.uuid}`);
        // optional: Reload
        // editor.load(draft);
      }
      break;

    case "Trash Draft":
      if (draft.isTrashed) {
        app.displayInfoMessage("Draft already in trash.");
      } else {
        draft.isTrashed = true;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Draft trashed: ${draft.uuid}`);
      }
      break;

    case "Toggle Flag":
      draft.isFlagged = !draft.isFlagged;
      draft.update();
      log(
        `[ManageDraftWithPromptExecutor] Draft flagged status is now: ${draft.isFlagged}`
      );
      break;

    case "Queue: MyActionName": {
      // We can do ephemeral JSON or fallback. Let's do fallback:
      const fallbackData = {
        draftAction: "MyActionName",
        params: {
          reason: "Executor used from ManageDraftWithPromptExecutor",
        },
      };
      draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackData));
      log(
        "[ManageDraftWithPromptExecutor] Set ExecutorData with fallback JSON for MyActionName."
      );

      const executor = Action.find("Drafts Action Executor");
      if (!executor) {
        showAlert(
          "Executor Not Found",
          "Unable to locate 'Drafts Action Executor'."
        );
        break;
      }
      const queued = app.queueAction(executor, draft);
      if (queued) {
        log(
          "[ManageDraftWithPromptExecutor] Queued MyActionName successfully."
        );
      } else {
        log(
          "[ManageDraftWithPromptExecutor] Failed to queue MyActionName!",
          true
        );
      }
      break;
    }

    case "Queue: BatchProcessAction": {
      // Another example of ephemeral fallback approach
      const fallbackData = {
        draftAction: "BatchProcessAction",
        params: { reason: "User picked BatchProcessAction in orchestrator" },
      };
      draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackData));
      log(
        "[ManageDraftWithPromptExecutor] Set ExecutorData for BatchProcessAction."
      );

      const executor = Action.find("Drafts Action Executor");
      if (!executor) {
        showAlert(
          "Executor Not Found",
          "Unable to locate 'Drafts Action Executor'."
        );
        break;
      }
      const queued = app.queueAction(executor, draft);
      if (queued) {
        log(
          "[ManageDraftWithPromptExecutor] Queued BatchProcessAction successfully."
        );
      } else {
        log(
          "[ManageDraftWithPromptExecutor] Failed to queue BatchProcessAction!",
          true
        );
      }
      break;
    }
  }

  // Not automatically loading next draft.
  // If user wants to open the next draft, they can do so manually,
  // then re-run this script with a keyboard shortcut or toolbar button.

  script.complete();
}
