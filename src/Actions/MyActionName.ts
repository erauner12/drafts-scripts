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

  // For demonstration, let's show an alert summarizing them:
  const summary =
    "DraftData:\n" +
    JSON.stringify(draftData, null, 2) +
    "\n\nCustomParams:\n" +
    JSON.stringify(customParams, null, 2);
  showAlert("MyActionName Summary", summary);

  // Here you can do something with draftData or customParams as needed.
}
