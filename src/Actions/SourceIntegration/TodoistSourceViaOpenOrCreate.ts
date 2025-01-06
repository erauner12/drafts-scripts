import {
  openOrCreateDraftWithTitleAndAction,
  resolveClipboardText,
} from "../../helpers/helpers-open-or-create";

/**
 * runTodoistSourceViaOpenOrCreate
 *
 * Example bridging function to replicate a URL scheme call like:
 * drafts://open?title=task_8729387296&amp;allowCreate=true&amp;action=Todoist%20Source
 *
 * Because we may want to pass text via the clipboard, or some
 * custom param, we handle that below.
 */
export function runTodoistSourceViaOpenOrCreate(
  customTitle?: string,
  customText?: string
) {
  // If no text is provided, we read from the clipboard
  // Note that we can also accept a custom text param if desired,
  // in case TOT or another system is passing it along.
  // Resolve text from either `customText` or the clipboard
  const textToUse = resolveClipboardText(customText);

  // If no title is provided, default to something like "task_12345"
  // In a real scenario, we'd pass it in from TOT or an external URL param
  const titleToUse = customTitle || "task_12345";

  // Use our new openOrCreateDraftWithTitleAndAction helper
  openOrCreateDraftWithTitleAndAction({
    title: titleToUse,
    text: textToUse,
    actionName: "Todoist Source",
    tags: ["todoist"], // or any tags you'd like to set
  });
}
