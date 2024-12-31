import { log, showAlert } from "../helpers-utils";

/**
 * ManageDraftWithPromptExecutor.ts
 *
 * This script demonstrates an "orchestrator" approach for the currently loaded
 * draft in the editor. The user can:
 *  - Archive or Trash the draft, upon which we auto-load the next relevant draft
 *    from the same workspace.
 *  - Toggle Flag or do other local modifications.
 *  - Queue an external action (like MyActionName or BatchProcessAction) via
 *    DraftActionExecutor and ephemeral/fallback JSON.
 *
 * Once we've done an operation that removes the draft from the workspace
 * (archive or trash), we attempt to load the next relevant draft from the
 * workspace so the user can continue processing. If none is found, we simply end.
 */

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
  title: string;
  update(): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  hasTag(tag: string): boolean;
  setTemplateTag(t: string, v: string): void;
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
 * Usage:
 *  - Assign a keyboard shortcut or toolbar button to this action.
 *  - Open a draft in the editor, run the action, pick an option in the prompt.
 *  - If you archive or trash the draft, this script tries to load the next
 *    unarchived/untrashed draft in the current workspace (scanning forward, then backward).
 *  - If you queue an external action, we add ephemeral/fallback JSON to the draft
 *    and call the DraftActionExecutor.
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

  const p = new Prompt();
  p.title = "Manage Draft";
  p.message = `Current draft:\n"${
    draft.title
  }"\n\nContent Preview:\n${draft.content.slice(0, 100)}\n...`;

  p.addButton("Archive");
  p.addButton("Trash");
  p.addButton("Toggle Flag");
  p.addButton("Queue: MyActionName");
  p.addButton("Queue: BatchProcessAction");
  p.addButton("Cancel");

  if (!p.show() || p.buttonPressed === "Cancel") {
    log(
      "[ManageDraftWithPromptExecutor] User canceled prompt or pressed Cancel."
    );
    script.complete();
    return;
  }

  const choice = p.buttonPressed;
  log(`[ManageDraftWithPromptExecutor] User selected: ${choice}`);

  let removeFromWorkspace = false;

  switch (choice) {
    case "Archive":
      if (draft.isArchived) {
        app.displayInfoMessage("Draft already archived.");
      } else {
        draft.isArchived = true;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Archived draft ${draft.uuid}.`);
        removeFromWorkspace = true;
      }
      break;

    case "Trash":
      if (draft.isTrashed) {
        app.displayInfoMessage("Draft already trashed.");
      } else {
        draft.isTrashed = true;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Trashed draft ${draft.uuid}.`);
        removeFromWorkspace = true;
      }
      break;

    case "Toggle Flag":
      draft.isFlagged = !draft.isFlagged;
      draft.update();
      log(
        `[ManageDraftWithPromptExecutor] Toggled flag, now isFlagged = ${draft.isFlagged}`
      );
      break;

    case "Queue: MyActionName": {
      // Provide fallback JSON
      const fallbackData = {
        draftAction: "MyActionName",
        params: {
          reason: "User picked MyActionName in orchestrator",
        },
      };
      draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackData));
      log("[ManageDraftWithPromptExecutor] Set ExecutorData for MyActionName.");

      const executor = Action.find("Drafts Action Executor");
      if (!executor) {
        showAlert(
          "Executor Not Found",
          "Could not find 'Drafts Action Executor'."
        );
        break;
      }
      const queued = app.queueAction(executor, draft);
      if (!queued) {
        log(
          "[ManageDraftWithPromptExecutor] Failed to queue MyActionName!",
          true
        );
      } else {
        log(
          "[ManageDraftWithPromptExecutor] Queued MyActionName successfully."
        );
      }
      break;
    }

    case "Queue: BatchProcessAction": {
      // Provide fallback JSON
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
          "Could not find 'Drafts Action Executor'."
        );
        break;
      }
      const queued = app.queueAction(executor, draft);
      if (!queued) {
        log(
          "[ManageDraftWithPromptExecutor] Failed to queue BatchProcessAction!",
          true
        );
      } else {
        log(
          "[ManageDraftWithPromptExecutor] Queued BatchProcessAction successfully."
        );
      }
      break;
    }
  }

  // If we removed the draft from the workspace, load the next one
  if (removeFromWorkspace) {
    const nextDraft = findNextDraftInWorkspace(draft);
    if (nextDraft) {
      editor.load(nextDraft);
      log(
        `[ManageDraftWithPromptExecutor] Loaded next draft: "${nextDraft.title}" (uuid: ${nextDraft.uuid})`
      );
    } else {
      log(
        "[ManageDraftWithPromptExecutor] Could not find another draft to load in the workspace."
      );
    }
  }

  script.complete();
}

/**
 * findNextDraftInWorkspace(d)
 *
 * Given the current draft `d`, search the current workspace array to find
 * the next unarchived/untrashed draft, scanning forward from the current position.
 * If not found, scan backward. Return undefined if none is found.
 */
function findNextDraftInWorkspace(current: Draft): Draft | undefined {
  const workspaceDrafts = app.currentWorkspace.query("all");
  // Find index of current draft
  const currentIndex = workspaceDrafts.findIndex(
    (dr) => dr.uuid === current.uuid
  );

  if (currentIndex === -1) {
    log(
      "[ManageDraftWithPromptExecutor] Current draft not found in workspace query. Possibly filtered out?"
    );
    return;
  }

  // Try to find the next untrashed/unarchived forward
  for (let i = currentIndex + 1; i < workspaceDrafts.length; i++) {
    if (!workspaceDrafts[i].isArchived && !workspaceDrafts[i].isTrashed) {
      return workspaceDrafts[i];
    }
  }

  // If not found forward, search backward
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (!workspaceDrafts[i].isArchived && !workspaceDrafts[i].isTrashed) {
      return workspaceDrafts[i];
    }
  }

  return;
}
