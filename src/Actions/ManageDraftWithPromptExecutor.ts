// ManageDraftWithPromptExecutor.ts

import { log, showAlert } from "../helpers-utils";

/**
 * This version does not hard-filter isArchived/isTrashed
 * in the next-draft search, so it will work for any workspace,
 * including those showing archived or flagged drafts.
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

export async function runManageDraftWithPromptExecutor(): Promise<void> {
  if (!draft) {
    log("[ManageDraftWithPromptExecutor] No loaded draft found!");
    script.complete();
    return;
  }

  log(
    `[ManageDraftWithPromptExecutor] Acting on draft: "${draft.title}" (uuid: ${draft.uuid})`
  );

  // Get the original array from the workspace *before* changes:
  const workspaceDrafts = app.currentWorkspace.query("all");
  const currentIndex = workspaceDrafts.findIndex(
    (dr) => dr.uuid === draft.uuid
  );
  if (currentIndex === -1) {
    log(
      "[ManageDraftWithPromptExecutor] Current draft not in workspace array; continuing anyway."
    );
  }

  // Prompt the user
  const p = new Prompt();
  p.title = "Manage Draft";
  p.message = `"${draft.title}"\n\nContent:\n${draft.content.slice(0, 100)}`;
  p.addButton("Archive");
  p.addButton("Trash");
  p.addButton("Toggle Flag");
  p.addButton("Queue: MyActionName");
  p.addButton("Queue: BatchProcessAction");
  p.addButton("Cancel");

  if (!p.show() || p.buttonPressed === "Cancel") {
    log("[ManageDraftWithPromptExecutor] User canceled prompt.");
    script.complete();
    return;
  }

  const choice = p.buttonPressed;
  log(`[ManageDraftWithPromptExecutor] User selected: ${choice}`);

  let removeDraft = false; // indicates we should move to next item

  switch (choice) {
    case "Archive":
      if (!draft.isArchived) {
        draft.isArchived = true;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Draft archived: ${draft.uuid}`);
      } else {
        app.displayInfoMessage("Draft is already archived.");
      }
      removeDraft = true;
      break;

    case "Trash":
      if (!draft.isTrashed) {
        draft.isTrashed = true;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Draft trashed: ${draft.uuid}`);
      } else {
        app.displayInfoMessage("Draft is already trashed.");
      }
      removeDraft = true;
      break;

    case "Toggle Flag":
      draft.isFlagged = !draft.isFlagged;
      draft.update();
      log(
        `[ManageDraftWithPromptExecutor] Flag toggled. Now isFlagged = ${draft.isFlagged}`
      );
      // If unflagging in a flagged workspace, the draft might vanish from that workspace
      removeDraft = true;
      break;

    case "Queue: MyActionName": {
      const fallbackData = {
        draftAction: "MyActionName",
        params: {
          context: "Chosen from ManageDraftWithPromptExecutor",
        },
      };
      draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackData));
      log("[ManageDraftWithPromptExecutor] Set ExecutorData for MyActionName.");

      const executor = Action.find("Drafts Action Executor");
      if (!executor) {
        showAlert(
          "Executor Not Found",
          "Cannot find 'Drafts Action Executor'."
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
      // We do NOT necessarily remove from workspace, because queueing doesn't always remove it
      // If you do want to remove it, set removeDraft = true
      break;
    }

    case "Queue: BatchProcessAction": {
      const fallbackData = {
        draftAction: "BatchProcessAction",
        params: { context: "Chosen from ManageDraftWithPromptExecutor" },
      };
      draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackData));
      log(
        "[ManageDraftWithPromptExecutor] Set ExecutorData for BatchProcessAction."
      );

      const executor = Action.find("Drafts Action Executor");
      if (!executor) {
        showAlert(
          "Executor Not Found",
          "Cannot find 'Drafts Action Executor'."
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
      // Same note as above – queueing doesn't necessarily remove the draft from workspace
      break;
    }
  }

  // If we want to move on to the next item in the array, let's do so:
  if (removeDraft && currentIndex !== -1) {
    const next = findNextDraft(workspaceDrafts, currentIndex);
    if (next) {
      editor.load(next);
      log(
        `[ManageDraftWithPromptExecutor] Loaded next: "${next.title}" (uuid: ${next.uuid})`
      );
    } else {
      log(
        "[ManageDraftWithPromptExecutor] No next draft found in the workspace array."
      );
    }
  }

  script.complete();
}

/**
 * findNextDraft
 *
 * This function just returns the next item in the array if it exists; if not,
 * tries the previous item. We do NOT check for isArchived/isTrashed any more.
 * The workspace array is already filtered by the workspace's settings, so
 * only the drafts that appear in that workspace appear in the array.
 */
function findNextDraft(list: Draft[], index: number): Draft | undefined {
  // Try forward
  if (index + 1 < list.length) {
    return list[index + 1];
  }
  // Otherwise backward
  if (index - 1 >= 0) {
    return list[index - 1];
  }
  // Nothing found
  return undefined;
}
