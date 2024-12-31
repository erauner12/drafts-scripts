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
