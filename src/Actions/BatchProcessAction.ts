import { log, showAlert } from "../helpers-utils";

/**
 * runBatchProcessAction()
 *
 * This is a sample "BatchProcessAction" to demonstrate reading ephemeral JSON
 * versus ExecutorData fallback, plus illustrating how we can store items for further processing
 * in the ExecutorData tag. The code is pseudo-sample, so adapt to your real usage.
 */
export function runBatchProcessAction(): void {
  // If ephemeral draft is already processed under this scope, skip
  if (draft.hasTag("status::batch-processed")) {
    log(
      "[BatchProcessAction] Draft has 'status::batch-processed'; skipping re-processing."
    );
    return;
  }

  log("[BatchProcessAction] Starting runBatchProcessAction...");

  // 1) Check ephemeral JSON from the ephemeral draft
  let ephemeralJsonRaw = draft.content.trim();
  let ephemeralJson: any = {};
  let ephemeralHasDraftAction = false;

  try {
    let maybeParsed = JSON.parse(ephemeralJsonRaw);
    if (maybeParsed && maybeParsed.draftAction) {
      ephemeralJson = maybeParsed;
      ephemeralHasDraftAction = true;
      log(
        "[BatchProcessAction] Detected ephemeral JSON with draftAction: " +
          ephemeralJson.draftAction
      );
    }
  } catch (err) {
    log(
      "[BatchProcessAction] No ephemeral JSON found in draft.content or it didn't parse."
    );
  }

  // 2) If ephemeral JSON not found or missing 'draftAction', check fallback ExecutorData tag
  let fallbackJsonRaw = "";
  if (!ephemeralHasDraftAction) {
    fallbackJsonRaw = draft.getTemplateTag("ExecutorData") || "";
    if (fallbackJsonRaw) {
      log("[BatchProcessAction] Found fallback JSON from ExecutorData tag.");
      try {
        let fallbackParsed = JSON.parse(fallbackJsonRaw);
        ephemeralJson = fallbackParsed;
        ephemeralHasDraftAction = !!fallbackParsed.draftAction;
      } catch (err) {
        log(
          "[BatchProcessAction] Could not parse fallback ExecutorData JSON.",
          true
        );
      }
    }
  }

  // 3) If still no action name at this point, then user called this action w/o data
  if (!ephemeralHasDraftAction) {
    log(
      "[BatchProcessAction] No ephemeral or fallback JSON with draftAction. We may just show an alert or skip."
    );
    showAlert(
      "BatchProcessAction",
      "No 'draftAction' found in ephemeral JSON or ExecutorData. Nothing to process."
    );
    return;
  }

  // 4) Suppose ephemeralJson contains some items we want to process.
  let params = ephemeralJson.params || {};
  log("[BatchProcessAction] params = " + JSON.stringify(params));

  // 5) Decide next step: maybe we store some data back to ExecutorData or queue a different action.
  // We'll do a quick example of storing items in ExecutorData. Suppose we want another action called "ProcessItemsAction".
  if (params.tasks) {
    log(
      "[BatchProcessAction] Found tasks array. We'll re-queue 'ProcessItemsAction' with these tasks."
    );

    let storeObj = {
      draftAction: "ProcessItemsAction",
      tasks: params.tasks,
    };
    let storeJson = JSON.stringify(storeObj);

    draft.setTemplateTag("ExecutorData", storeJson);
    log("[BatchProcessAction] Set ExecutorData with items to process.");

    // Now queue the Draft Action Executor again, which *should* see the new ExecutorData and run "ProcessItemsAction".
    const executor = Action.find("Drafts Action Executor");
    if (!executor) {
      log("[BatchProcessAction] Could not find 'Drafts Action Executor'", true);
      showAlert("Error", "Couldn't find Drafts Action Executor to continue.");
      return;
    }
    let success = app.queueAction(executor, draft);
    if (success) {
      log("[BatchProcessAction] Successfully queued Drafts Action Executor.");
    } else {
      log("[BatchProcessAction] Failed to queue Drafts Action Executor!", true);
    }

    return;
  }

  // 6) Otherwise, if we don’t have tasks or something, we might do final processing right here:
  log(
    "[BatchProcessAction] No tasks provided, so finishing. You can implement custom logic here."
  );
  showAlert(
    "BatchProcessAction Complete",
    "Nothing to process or queued next step successfully."
  );

  // Mark ephemeral draft as batch-processed
  draft.addTag("status::batch-processed");
  draft.update();

  // Done
}
