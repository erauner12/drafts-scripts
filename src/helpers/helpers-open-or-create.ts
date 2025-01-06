/**
 * helpers-open-or-create.ts
 *
 * A utility that replicates the "open?title=someTitle&amp;allowCreate=true&amp;action=SomeAction"
 * style of the Drafts URL scheme, but using our internal frameworks.
 *
 * Usage Example:
 *   openOrCreateDraftWithTitleAndAction({
 *     title: "My Title",
 *     text: "If no draft found, create one with this text.",
 *     actionName: "MyActionName",
 *     tags: ["myTag", "testTag"]
 *   });
 *
 * This function uses standard Drafts objects and methods to:
 * 1. Search for an existing draft by the first line matching `title`.
 * 2. If found, optionally queue an action or load it in the editor.
 * 3. If not found, create a new draft with `title` as first line and optional tags.
 *    Then optionally queue an action or load it in the editor.
 */

declare var editor: Editor;
declare var app: App;

/**
  * Resolve text from an optional custom string or from the clipboard if not provided,
  * with optional user confirmation.
  *
  * @param customText An optional string of text. If present and not empty, it is returned immediately.
  * @param options Object with optional flags:
  *   - promptClipboard: If true, display a prompt letting the user confirm use of clipboard text.
  *   - forceClipboard: If true, skip the prompt even if promptClipboard is set, forcing usage of clipboard if customText is empty.
  *
  * @returns The resolved text from either `customText`, or the confirmed (or forced) clipboard text. If user cancels, returns an empty string.
  *
  * @example
  * // Suppose user calls:
  * const text = resolveClipboardText("Hello from TOT");
  * // If "Hello from TOT" is non-empty, text === "Hello from TOT".
  *
  * const text2 = resolveClipboardText();
  * // If nothing is passed, text2 is the current clipboard content
  * // evaluated by draft.processTemplate("[[clipboard]]").
  */
 export function resolveClipboardText(
   customText?: string,
   options?: {
     promptClipboard?: boolean;
     forceClipboard?: boolean;
   }
 ): string {
   const trimmed = (customText || "").trim();
   if (trimmed.length > 0) {
     return trimmed;
   }
   // If nothing was provided, or only whitespace, read from the clipboard
   const clipboardText = draft.processTemplate("[[clipboard]]");
   console.log(
     "[resolveClipboardText] No custom text supplied. Clipboard text is:",
     clipboardText
   );

   if (options?.forceClipboard) {
     console.log(
       "[resolveClipboardText] forceClipboard=true, returning clipboard text directly."
     );
     return clipboardText;
   }

   if (options?.promptClipboard) {
     const p = Prompt.create();
     p.title = "Use Clipboard Text?";
     p.message = `Clipboard contains:\n\n"${clipboardText}"\n\nUse this text?`;
     p.addButton("Yes");
     p.addButton("No");
     if (!p.show() || p.buttonPressed === "No") {
       console.log(
         "[resolveClipboardText] User canceled using clipboard data."
       );
       return "";
     }
     console.log(
       "[resolveClipboardText] User confirmed clipboard usage. Returning text."
     );
     return clipboardText;
   }

   return clipboardText;
 }
 
 interface OpenOrCreateOptions {
   title: string; // The draft title to look for in the first line.
   text?: string; // Optional text for new draft (if not found).
   tags?: string[]; // Optional array of tags to add if a new draft is created.
   actionName?: string; // Name of action to run if found or created. If omitted, we just load the draft in the editor.
   flagged?: boolean; // If new draft created, set flagged state
   archived?: boolean; // If new draft created, set archived state
 }

/**
 * openOrCreateDraftWithTitleAndAction
 *
 * Looks for an existing draft whose first line matches `title`.
 * If found, loads or queues action. If not found, creates a new one.
 */
export function openOrCreateDraftWithTitleAndAction(opts: OpenOrCreateOptions) {
  const { title, text, tags, actionName, flagged, archived } = opts;

  // 1) Attempt to find a draft by title
  const foundDrafts = Draft.queryByTitle(title) || [];

  let theDraft: Draft;
  if (foundDrafts.length > 0) {
    theDraft = foundDrafts[0];
    // If foundDrafts has more than one, we just take the first result.
  } else {
    // 2) Not found, so create a new one
    theDraft = Draft.create();
    const fullContent = text
      ? text.trim().startsWith(title)
        ? text
        : `${title}\n${text}`
      : title;

    theDraft.content = fullContent;
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        theDraft.addTag(tag);
      }
    }
    if (flagged !== undefined) {
      theDraft.isFlagged = flagged;
    }
    if (archived) {
      theDraft.isArchived = true;
    }
    theDraft.update();
  }

  // 3) If actionName is provided, queue the action. Otherwise, load the draft in the editor.
  if (actionName) {
    const actionToRun = Action.find(actionName);
    if (!actionToRun) {
      app.displayErrorMessage(
        `openOrCreateDraftWithTitleAndAction: Could not find action named "${actionName}".`
      );
      // Load the draft anyway, so user can see the created or found draft
      editor.load(theDraft);
      return;
    }
    // queue the action with the found or created draft
    const success = app.queueAction(actionToRun, theDraft);
    if (!success) {
      app.displayErrorMessage(
        `openOrCreateDraftWithTitleAndAction: Failed to queue "${actionName}" action.`
      );
      // At least load it
      editor.load(theDraft);
    }
  } else {
    // Just load in the editor
    editor.load(theDraft);
  }
}
