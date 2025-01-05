/**
 * CommonFlowUtils.ts
 *
 * A small collection of helper methods to unify error handling, cancelation, prompts, and logging.
 * Replace scattered calls to context.fail, alert, displayErrorMessage, etc.
 *
 * Usage:
 *   import { failAction, confirmPrompt } from "../helpers/CommonFlowUtils";
 *
 *   if (someError) {
 *     failAction("Error message", someError);
 *     return;
 *   }
 */

declare var context: Context;
declare var app: App;

/**
 * failAction
 * Logs an error message, optionally logs the error object,
 * notifies the user, and calls context.fail.
 */
export function failAction(message: string, error?: any): void {
  console.error("[FAIL ACTION]", message);
  if (error) {
    console.error("[FAIL ACTION:ERROR]", error);
  }
  app.displayErrorMessage(message);
  context.fail(message);
}

/**
 * cancelAction
 * Cancels the action with a provided message, logs it,
 * and optionally shows a warning message to the user.
 */
export function cancelAction(message: string, showWarning?: boolean): void {
  console.log("[CANCEL ACTION]", message);
  if (showWarning) {
    app.displayWarningMessage(message);
  }
  context.cancel(message);
}

/**
 * confirmPrompt
 * A quick yes/no style prompt returning a boolean.
 * Example usage:
 *   if (!confirmPrompt("Confirm Deletion", "This cannot be undone.")) { return; }
 */
export function confirmPrompt(
  title: string,
  message: string,
  yesButtonLabel = "Yes",
  noButtonLabel = "Cancel"
): boolean {
  const p = new Prompt();
  p.title = title;
  p.message = message;
  p.addButton(yesButtonLabel);
  p.addButton(noButtonLabel);
  const didShow = p.show();
  if (!didShow || p.buttonPressed === noButtonLabel) {
    console.log("[PROMPT] User chose to cancel in confirmPrompt.");
    return false;
  }
  return true;
}

/**
 * quickAlert
 * Simple wrapper for an alert() call or displayErrorMessage if desired.
 */
export function quickAlert(
  title: string,
  message: string,
  isError?: boolean
): void {
  console.log("[ALERT]", title, message);
  if (isError) {
    app.displayErrorMessage(title + ": " + message);
  } else {
    alert(title + "\n\n" + message);
  }
}
