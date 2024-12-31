// ManageDraftWithPromptExecutor.ts
//
// This script demonstrates an "orchestrator" approach for the currently loaded
// draft in the editor. The user can:
//  - Archive or Trash the draft, after which we attempt to load the "next" relevant draft
//    from the same workspace.
//  - Toggle Flag or do other local modifications.
//  - Queue an external action (like MyActionName or BatchProcessAction) via
//    DraftActionExecutor.
//
// We fix the scenario where trashing the draft is not found in the workspace
// by capturing the workspace's array and the draft's index BEFORE we modify it.

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
 * Steps:
 * 1) Capture the workspace array and the index of the current draft in that array, so that
 *    even if we remove the draft from the workspace (trash or archive), we still know where
 *    it was and can find the next item reliably.
 * 2) Show the user a prompt to pick an action (Archive, Trash, Flag, or Queue an external action).
 * 3) If we do something that removes the draft from the workspace, we load the next untrashed/unarchived
 *    draft from the original array if one exists (forward, then backward).
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

  // 1) Capture the workspace array and find the current index BEFORE modifications
  const workspaceDrafts = app.currentWorkspace.query("all");
  const currentIndex = workspaceDrafts.findIndex(
    (dr) => dr.uuid === draft.uuid
  );
  if (currentIndex === -1) {
    log(
      "[ManageDraftWithPromptExecutor] Current draft not found in workspace 'all' query. Possibly filtered out?"
    );
  }

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

  // 2) If we removed the draft from the workspace, attempt to load the next from the original array
  if (removeFromWorkspace && currentIndex !== -1) {
    const nextDraft = findNextDraftInWorkspace(workspaceDrafts, currentIndex);
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
 * findNextDraftInWorkspace(workspaceDrafts, currentIndex)
 *
 * Using the original array of workspace drafts & the current index,
 * find the next unarchived/untrashed draft by scanning forward, then backward,
 * ignoring the current draft's new state. This ensures we can find the next item
 * even if the current has changed to archived/trashed and disappeared from new queries.
 */
function findNextDraftInWorkspace(
  workspaceDrafts: Draft[],
  currentIndex: number
): Draft | undefined {
  // Scan forward
  for (let i = currentIndex + 1; i < workspaceDrafts.length; i++) {
    if (!workspaceDrafts[i].isArchived && !workspaceDrafts[i].isTrashed) {
      return workspaceDrafts[i];
    }
  }
  // If not found forward, scan backward
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (!workspaceDrafts[i].isArchived && !workspaceDrafts[i].isTrashed) {
      return workspaceDrafts[i];
    }
  }
  return undefined;
}
