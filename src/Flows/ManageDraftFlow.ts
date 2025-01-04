import { queueJsonAction } from "../executor/Executor";
import { log, showPromptWithButtons } from "../helpers/helpers-utils";

declare const script: Script;

/**
 * Example "ManageDraftFlow" which is more abstract and can be extended
 * or used in multiple variations.
 */

export function runManageDraftFlow(): void {
  if (!draft) {
    log("No loaded draft!");
    script.complete();
    return;
  }
  // We'll show a prompt for basic actions: Move, Trash, Flag, etc.
  const folder = app.currentWorkspace.loadFolder ?? "all";
  log("Workspace folder: " + folder);

  // Build a minimal prompt
  const buttonPressed = showPromptWithButtons(
    "Manage Draft Flow",
    `Folder: ${folder} || Draft: "${draft.title}"\n(${draft.uuid})`,
    ["Trash", "Move to Inbox", "Archive", "Queue: MyActionName", "Cancel"]
  );

  if (!buttonPressed) {
    log("User canceled ManageDraftFlow.");
    script.complete();
    return;
  }

  // Decide how to handle the user’s choice
  switch (p.buttonPressed) {
    case "Trash": {
      if (!draft.isTrashed) {
        draft.isTrashed = true;
        draft.update();
      }
      break;
    }
    case "Move to Inbox": {
      draft.isTrashed = false;
      draft.isArchived = false;
      draft.update();
      break;
    }
    case "Archive": {
      draft.isArchived = true;
      draft.update();
      break;
    }
    case "Queue: MyActionName": {
      // Instead of manually setting ExecutorData, let queueJsonAction handle ephemeral
      const ephemeralJson = { draftAction: "MyActionName" };
      queueJsonAction(ephemeralJson);
      break;
    }
  }

  script.complete();
}
