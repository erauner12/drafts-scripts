// ManageDraftWithPromptExecutor.ts
//
// This version customizes the prompt options based on the draft's current state.
// If the draft is archived, we might offer "Move to Inbox" instead of "Archive."
// If it's trashed, we might show only "Move to Inbox," etc.
//
// We also preserve the logic of capturing the workspace's array and index
// before modifications so we can find/load the next draft if needed.

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
 * runManageDraftWithPromptExecutor
 *
 * 1) Capture the workspace array & current index.
 * 2) Build a prompt with options relevant to the draft's state.
 * 3) Perform the selected operation. If it removed the draft from the workspace (archived, trashed, unflagged in a flagged workspace, etc.), we load the next draft in the original array.
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

  // Capture the original array so we can load next if needed
  const workspaceDrafts = app.currentWorkspace.query("all");
  const currentIndex = workspaceDrafts.findIndex(
    (dr) => dr.uuid === draft.uuid
  );
  if (currentIndex === -1) {
    log(
      "[ManageDraftWithPromptExecutor] Current draft not found in workspace array. Possibly filtered out already?"
    );
  }

  // Build our dynamic list of possible actions
  const p = new Prompt();
  p.title = "Manage Draft";
  p.message = `[${draft.uuid}]\n"${
    draft.title
  }"\n\nContent Preview:\n${draft.content.slice(0, 100)}`;

  // If draft is archived, we might want "Move to Inbox" or "Trash"
  // If draft is not archived, we might want "Archive"
  if (draft.isArchived) {
    p.addButton("Move to Inbox");
  } else if (!draft.isTrashed) {
    p.addButton("Archive");
  }
  // If draft is trashed, we might show a "Move to Inbox"
  if (draft.isTrashed) {
    p.addButton("Move to Inbox");
  } else {
    p.addButton("Trash");
  }

  // For flagged or unflagged
  if (draft.isFlagged) {
    p.addButton("Unflag");
  } else {
    p.addButton("Flag");
  }

  // Add queue options
  p.addButton("Queue: MyActionName");
  p.addButton("Queue: BatchProcessAction");

  // Finally, the cancel button
  p.addButton("Cancel");

  if (!p.show() || p.buttonPressed === "Cancel") {
    log("[ManageDraftWithPromptExecutor] User canceled prompt.");
    script.complete();
    return;
  }

  const choice = p.buttonPressed;
  log(`[ManageDraftWithPromptExecutor] User selected: ${choice}`);

  let draftRemoved = false; // We'll set this to true if we suspect the draft leaves the workspace.

  switch (choice) {
    case "Archive":
      if (!draft.isArchived) {
        draft.isArchived = true;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Archived draft: ${draft.uuid}`);
        draftRemoved = true;
      } else {
        app.displayInfoMessage("Draft is already archived.");
      }
      break;

    case "Trash":
      if (!draft.isTrashed) {
        draft.isTrashed = true;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Trashed draft: ${draft.uuid}`);
        draftRemoved = true;
      } else {
        app.displayInfoMessage("Draft is already trashed.");
      }
      break;

    case "Move to Inbox":
      if (draft.isArchived || draft.isTrashed) {
        draft.isArchived = false;
        draft.isTrashed = false;
        draft.update();
        log(
          `[ManageDraftWithPromptExecutor] Moved draft to Inbox: ${draft.uuid}`
        );
        // If we were in the archive or trash workspace, we might want to auto-load next.
        draftRemoved = true;
      } else {
        app.displayInfoMessage("Draft is already in Inbox.");
      }
      break;

    case "Flag":
      if (!draft.isFlagged) {
        draft.isFlagged = true;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Flagged draft: ${draft.uuid}`);
      } else {
        app.displayInfoMessage("Draft is already flagged.");
      }
      break;

    case "Unflag":
      if (draft.isFlagged) {
        draft.isFlagged = false;
        draft.update();
        log(`[ManageDraftWithPromptExecutor] Unflagged draft: ${draft.uuid}`);
        // if the workspace was flagged-only, removing the flag means it leaves
        draftRemoved = true;
      } else {
        app.displayInfoMessage("Draft was not flagged.");
      }
      break;

    case "Queue: MyActionName": {
      const fallbackData = {
        draftAction: "MyActionName",
        params: { reason: "Called from ManageDraftWithPromptExecutor" },
      };
      draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackData));
      log("[ManageDraftWithPromptExecutor] Set ExecutorData for MyActionName.");

      const executor = Action.find("Drafts Action Executor");
      if (!executor) {
        showAlert(
          "Executor Not Found",
          "Unable to find 'Drafts Action Executor'."
        );
        break;
      }
      const success = app.queueAction(executor, draft);
      log(
        success
          ? "[ManageDraftWithPromptExecutor] Queued MyActionName successfully."
          : "[ManageDraftWithPromptExecutor] Failed to queue MyActionName!",
        !success
      );
      // By default, queueing alone might not remove it from workspace unless the action does so
      break;
    }

    case "Queue: BatchProcessAction": {
      const fallbackData = {
        draftAction: "BatchProcessAction",
        params: { reason: "Called from ManageDraftWithPromptExecutor" },
      };
      draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackData));
      log(
        "[ManageDraftWithPromptExecutor] Set ExecutorData for BatchProcessAction."
      );

      const executor = Action.find("Drafts Action Executor");
      if (!executor) {
        showAlert(
          "Executor Not Found",
          "Unable to find 'Drafts Action Executor'."
        );
        break;
      }
      const success = app.queueAction(executor, draft);
      log(
        success
          ? "[ManageDraftWithPromptExecutor] Queued BatchProcessAction successfully."
          : "[ManageDraftWithPromptExecutor] Failed to queue BatchProcessAction!",
        !success
      );
      break;
    }
  }

  // If the draft was presumably removed from the workspace, we attempt to load next
  if (draftRemoved && currentIndex !== -1) {
    const nextDraft = findNextDraft(workspaceDrafts, currentIndex);
    if (nextDraft) {
      editor.load(nextDraft);
      log(
        `[ManageDraftWithPromptExecutor] Loaded next draft: "${nextDraft.title}" (uuid: ${nextDraft.uuid})`
      );
    } else {
      log(
        "[ManageDraftWithPromptExecutor] No next draft found in workspace array."
      );
    }
  }

  script.complete();
}

/**
 * findNextDraft
 *
 * We keep it simple: look at the item after the currentIndex. If none, look at item before.
 * We do NOT check isTrashed/isArchived because the workspace array is presumably already
 * representing what's in this workspace prior to changes.
 */
function findNextDraft(list: Draft[], index: number): Draft | undefined {
  // forward
  if (index + 1 < list.length) {
    return list[index + 1];
  }
  // backward
  if (index - 1 >= 0) {
    return list[index - 1];
  }
  return undefined;
}
