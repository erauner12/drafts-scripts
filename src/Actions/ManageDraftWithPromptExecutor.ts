import { log, showAlert } from "../helpers-utils";

declare var draft: Draft;
declare var app: {
  currentWorkspace: Workspace;
  applyWorkspace(ws: Workspace): void;
  queueAction(action: any, d: Draft): boolean;
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

type draftFolderTab = "inbox" | "flagged" | "archive" | "trash" | "all";

interface Draft {
  uuid: string;
  content: string;
  title: string;
  isTrashed: boolean;
  isArchived: boolean;
  isFlagged: boolean;
  update(): void;
  setTemplateTag(t: string, v: string): void;
}

interface Workspace {
  loadFolder?: draftFolderTab;
  tagFilter: string;
  flaggedStatus: string;
  // ...
  query(filter: draftFolderTab): Draft[];
}

declare class Prompt {
  title: string;
  message: string;
  buttonPressed: string;
  addButton(title: string): void;
  show(): boolean;
}

/**
 * runManageDraftWithPromptExecutor
 *
 * Attempt to read app.currentWorkspace.loadFolder to guide which actions to show,
 * but if it seems mismatched with the actual draft state, we fallback on just showing
 * the relevant actions from the draft’s isArchived/isTrashed/isFlagged.
 */
export function runManageDraftWithPromptExecutor(): void {
  if (!draft) {
    log("No loaded draft!");
    script.complete();
    return;
  }

  const ws = app.currentWorkspace;
  const folder = ws.loadFolder ?? "all"; // Might be "inbox", "archive", "flagged", "trash", "all" or undefined
  log(`Workspace folder from app.currentWorkspace: ${folder}`);

  // We'll do the array capture in case we remove from the workspace
  const workspaceDrafts = ws.query(folder);
  const currentIndex = workspaceDrafts.findIndex(
    (dr) => dr.uuid === draft.uuid
  );

  // We'll build a prompt that tries to adapt. If the folder is "archive" but the draft is not archived,
  // maybe the user has some custom filter. We'll show general actions anyway.

  const p = new Prompt();
  p.title = "Manage Draft";
  p.message = `Folder: ${folder} || Draft: "${draft.title}"\n(${draft.uuid})`;

  if (folder === "archive") {
    // If the draft is not actually archived, the user might have a custom filter. We'll still show Move to Inbox if archived, etc.
    if (draft.isArchived) p.addButton("Move to Inbox");
    p.addButton("Trash");
    if (draft.isFlagged) p.addButton("Unflag");
    else p.addButton("Flag");
  } else if (folder === "flagged") {
    // If the draft isn't flagged, it might be in a custom filter. We'll handle that gracefully:
    if (draft.isFlagged) p.addButton("Unflag");
    if (!draft.isArchived) p.addButton("Archive");
    if (!draft.isTrashed) p.addButton("Trash");
  } else if (folder === "trash") {
    // If the draft isTrashed, we can show Move to Inbox.
    if (draft.isTrashed) p.addButton("Move to Inbox");
  } else if (folder === "inbox") {
    // Typical approach: show Archive, Trash, Flag
    if (!draft.isArchived) p.addButton("Archive");
    if (!draft.isTrashed) p.addButton("Trash");
    if (draft.isFlagged) p.addButton("Unflag");
    else p.addButton("Flag");
  } else {
    // "all" or unknown
    // We'll just show everything
    if (!draft.isArchived) p.addButton("Archive");
    if (!draft.isTrashed) p.addButton("Trash");
    if (draft.isFlagged) p.addButton("Unflag");
    else p.addButton("Flag");
  }

  // Always provide queue options
  p.addButton("Queue: MyActionName");
  p.addButton("Queue: BatchProcessAction");
  p.addButton("Cancel");

  if (!p.show() || p.buttonPressed === "Cancel") {
    log("User canceled.");
    script.complete();
    return;
  }

  const choice = p.buttonPressed;
  log(`User chose: ${choice}`);
  let removeDraft = false;

  switch (choice) {
    case "Archive":
      if (!draft.isArchived) {
        draft.isArchived = true;
        draft.update();
        removeDraft =
          folder === "inbox" || folder === "flagged" || folder === "all";
      }
      break;

    case "Trash":
      if (!draft.isTrashed) {
        draft.isTrashed = true;
        draft.update();
        removeDraft = folder !== "trash";
      }
      break;

    case "Move to Inbox":
      if (draft.isArchived || draft.isTrashed) {
        draft.isArchived = false;
        draft.isTrashed = false;
        draft.update();
        removeDraft =
          folder === "archive" || folder === "trash" || folder === "flagged";
      }
      break;

    case "Flag":
      if (!draft.isFlagged) {
        draft.isFlagged = true;
        draft.update();
        // If we were in "flagged" folder, that might not remove it. If we were in "inbox" or "archive," it stays
        removeDraft = false;
      }
      break;

    case "Unflag":
      if (draft.isFlagged) {
        draft.isFlagged = false;
        draft.update();
        removeDraft = folder === "flagged";
      }
      break;

    case "Queue: MyActionName": {
      const data = { draftAction: "MyActionName" };
      draft.setTemplateTag("ExecutorData", JSON.stringify(data));
      const ex = Action.find("Drafts Action Executor");
      if (!ex) {
        showAlert("No Executor", "Can't find 'Drafts Action Executor'.");
        break;
      }
      const queued = app.queueAction(ex, draft);
      log(
        queued ? "Queued MyActionName." : "Failed to queue MyActionName.",
        !queued
      );
      break;
    }
  }

  // If the draft was presumably removed from this workspace, load next from the original array
  if (removeDraft && currentIndex !== -1) {
    const next = findNextDraft(workspaceDrafts, currentIndex);
    if (next) {
      editor.load(next);
      log(`Loaded next: "${next.title}" (uuid: ${next.uuid})`);
    } else {
      log("No next draft in array.");
    }
  }

  script.complete();
}

/**
 * findNextDraft
 * We just take the item after the current index, else before, ignoring state.
 */
function findNextDraft(list: Draft[], idx: number): Draft | undefined {
  if (idx + 1 < list.length) return list[idx + 1];
  if (idx - 1 >= 0) return list[idx - 1];
  return undefined;
}
