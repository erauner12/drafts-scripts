/**
 * MyActionName
 *
 * This action demonstrates a flexible approach that supports three usage scenarios:
 *
 * 1) Ephemeral JSON (from External URL or some ephemeral draft):
 *    - If the user calls Drafts via x-callback-url with a JSON payload including
 *      `{"draftAction":"MyActionName","params":{...}}`, then DraftActionExecutor
 *      will parse that ephemeral JSON and store it as `draftData` or `customParams`.
 *    - Inside runMyActionName(), we read those objects to perform data-driven logic.
 *
 * 2) Fallback JSON (ExecutorData Tag):
 *    - If ephemeral JSON is not found, DraftActionExecutor looks for fallback JSON in
 *      the "ExecutorData" template tag on the current draft.
 *    - If it finds `{"draftAction":"MyActionName","params":{...}}` there, we parse
 *      and proceed similarly.
 *
 * 3) Directly using the loaded Draft in the Editor:
 *    - If neither ephemeral nor fallback JSON are found, we fall back to the
 *      current draft in the editor. The example logs the draft’s content,
 *      sets a scoped tag, and updates the draft.
 *    - This scenario is helpful when you invoke the Executor (or queue an action)
 *      without structured JSON, but still want to operate on the “active” draft
 *      loaded in the editor.
 *
 * Key Points in the Code:
 *  - We do `draftData = JSON.parse(...)` or fallback logic if ephemeral data is not found.
 *  - If `draftData` and `customParams` are empty, we look at `draft.content`,
 *    `draft.tags`, etc., to manipulate the loaded draft.
 *  - We specifically show how to add a “status::processed” scoped tag,
 *    how to log `draft.toJSON()`, and how to reload the draft in the editor to
 *    reflect those changes.
 *
 * Usage in Your Own Actions:
 *  - You can replicate this pattern in your own actions.
 *  - If your action is intended to be triggered by ephemeral JSON
 *    (like from an external script or app), it will process that data.
 *  - Otherwise, it can gracefully operate on the currently loaded draft
 *    without requiring an ephemeral payload.
 *
 * For more details, see the DraftActionExecutor and the ephemeral JSON
 * approach in the repository’s documentation.
 */

import { log, showAlert } from "../helpers-utils";

// We'll assume "draft" is available globally in Drafts
declare var draft: {
  getTemplateTag(key: string): string | null;
};

export function runMyActionName() {
  // Grab the stored tags set by DraftActionExecutor
  const draftDataRaw = draft.getTemplateTag("DraftData") || "";
  const customParamsRaw = draft.getTemplateTag("CustomParams") || "";

  let draftData: any = {};
  let customParams: any = {};

  try {
    if (draftDataRaw) {
      draftData = JSON.parse(draftDataRaw);
    }
    if (customParamsRaw) {
      customParams = JSON.parse(customParamsRaw);
    }
  } catch (error) {
    log("Error parsing template tags: " + String(error), true);
  }

  log("=== [MyActionName] runMyActionName() invoked ===");
  log("DraftData (parsed): " + JSON.stringify(draftData));
  log("CustomParams (parsed): " + JSON.stringify(customParams));

  // If ephemeral data doesn't exist (both empty), let's handle the loaded draft directly
  if (
    (!draftData || Object.keys(draftData).length === 0) &&
    (!customParams || Object.keys(customParams).length === 0)
  ) {
    log(
      "[MyActionName] No ephemeral JSON data found. Processing loaded draft directly..."
    );

    // Log basic info about the loaded draft
    const loadedContent = draft.content;
    log("[MyActionName] Loaded draft content:\n" + loadedContent);
    log("[MyActionName] Draft metadata:");
    log(" • UUID: " + draft.uuid);
    log(" • Title: " + draft.title);
    log(" • isTrashed: " + draft.isTrashed);
    log(" • isArchived: " + draft.isArchived);
    log(" • isFlagged: " + draft.isFlagged);
    log(" • Current Tags: " + draft.tags.join(", "));

    // We could manipulate the draft, e.g. add a scoped tag
    // For demonstration, let's add "status::processed"
    if (!draft.hasTag("status::processed")) {
      draft.addTag("status::processed");
      draft.update();
      log(
        "[MyActionName] Added scoped tag 'status::processed' to the loaded draft."
      );

      // Verify by logging the full toJSON output
      const afterJson = draft.toJSON();
      log(
        "[MyActionName] Post-update draft.toJSON():\n" +
          JSON.stringify(afterJson, null, 2)
      );

      // Optional: Force the editor to reload the same draft so the UI shows updated tags
      editor.load(draft);
      log(
        "[MyActionName] Reloaded this draft in the editor to reflect updated tags."
      );
    }

    // Show an alert summarizing the changes we made
    let draftSummary = `
UUID: ${draft.uuid}
Title: ${draft.title}
Tags: ${draft.tags.join(", ")}
isFlagged: ${draft.isFlagged}
isTrashed: ${draft.isTrashed}
isArchived: ${draft.isArchived}

Content:
${draft.content}
    `;
    showAlert(
      "[MyActionName] No ephemeral JSON data",
      "We processed the loaded draft:\n" + draftSummary
    );
  }

  // For demonstration, let's show an alert summarizing ephemeral data or fallback usage
  const summary =
    "DraftData:\n" +
    JSON.stringify(draftData, null, 2) +
    "\n\nCustomParams:\n" +
    JSON.stringify(customParams, null, 2);
  showAlert("MyActionName Summary", summary);

  // Here you can do something with draftData or customParams as needed.
}
