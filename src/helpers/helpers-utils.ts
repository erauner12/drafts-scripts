import { getSelectedText } from "./helpers-get-text";

/**
 * Retrieves the current content of the system clipboard.
 * @returns {string} The text content of the clipboard.
 */
export const getClipboard = (): string => {
  // @ts-ignore
  return app.getClipboard();
};

/**
 * Copies the given text to the system clipboard.
 * @param {string} text - The text to be copied to the clipboard.
 */
export const copyToClipboard = (text: string): void => {
  // @ts-ignore
  app.setClipboard(text);
};

/**
 * Copies the currently selected text to the system clipboard.
 */
export const copySelectedTextToClipboard = (): void => {
  const selectedText = getSelectedText();
  copyToClipboard(selectedText);
};

/**
 * Determines whether the provided string is a valid URL.
 * @param {string} s - The string to be tested against the URL pattern.
 * @returns {boolean} True if the string is a valid URL, otherwise false.
 */
export const isUrl = (s: string): boolean => {
  const urlRegex =
    /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
  return urlRegex.test(s);
};

/**
 * Retrieves a URL from the system clipboard if it contains a valid URL.
 * @returns {string} The URL from the clipboard or an empty string if no valid URL is found.
 */
export const getUrlFromClipboard = (): string => {
  const clipboard = getClipboard();
  return isUrl(clipboard) ? clipboard : "";
};

/**
 * Logs a message to the Drafts action log. If critical is set, logs as an error and shows an alert.
 */
export function log(message: string, critical: boolean = false): void {
  console.log(message);
  if (critical) {
    alert(message);
  }
}

/**
 * Shows an alert with the given title and message.
 */
export function showAlert(title: string, message: string): void {
  alert(`${title}\n\n${message}`);
}

/**
 * A reusable helper to show a simple Prompt with multiple buttons.
 * Returns the text of the button pressed, or null if cancelled or closed.
 */
export function showPromptWithButtons(title: string, message: string, buttonLabels: string[]): string | null {
  const p = new Prompt();
  p.title = title;
  p.message = message;
  for (const label of buttonLabels) {
    p.addButton(label);
  }
  if (!p.show()) {
    return null;
  }
  if (p.buttonPressed === "Cancel") {
    return null;
  }
  return p.buttonPressed;
}

/**
 * Gets or creates a Todoist credential instance.
 * @returns {Todoist} A configured Todoist instance with the user's API token
 */
export function getTodoistCredential(): Todoist {
  const credential = Credential.create("Todoist", "Todoist API access");
  credential.addPasswordField("token", "API Token");
  credential.authorize();

  const todoist = Todoist.create();
  todoist.token = credential.getValue("token");
  return todoist;
}