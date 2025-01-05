/**
 * TOTIntegration.ts
 *
 * This script replicates the old TOT JavaScript approach in TypeScript.
 * It provides a single `runTOTIntegration` function which:
 *  - Prompts user for a TOT (#1..7).
 *  - Fetches that TOT's content (via AppleScript on macOS or Shortcuts on iOS).
 *  - Shows a menu to Open, Append, or Replace the TOT's content with the current Draft data.
 *  - Previews existing TOT content if user might overwrite it.
 *  - Then uses the "tot://..." URL scheme to perform the final update.
 */

declare const device: Device;
declare const app: App;
declare const draft: Draft;
declare const context: Context;
declare const script: Script;

export async function runTOTIntegration(): Promise<void> {
  try {
    /**
     * Helper: Run a Shortcut on iOS to fetch TOT content.
     * Return "true" if successful, "false" if user must install the Shortcut or an error occurs.
     */
    function getTotMobile(
      totID: number,
      shortcutName: string,
      shortcutUrl: string
    ): boolean {
      // Example: "Get Tot Content" with an associated iCloud link
      // The user must have installed this Shortcut on their device.
      const cb = CallbackURL.create();
      cb.baseURL = "shortcuts://run-shortcut";
      cb.addParameter("name", shortcutName);
      cb.addParameter("input", totID.toString());

      // Attempt to run
      const objResult: { content?: string; status?: string } = {};
      if (cb.open()) {
        // Callback completed
        objResult.content = cb.callbackResponse.result || "";
      }
      objResult.status = cb.status;

      if (objResult.status === "error") {
        // Shortcut not found, prompt user to install
        const BUTTON_TEXT = "Get Shortcut";
        const promptSC = new Prompt();
        promptSC.title = "Shortcut Not Available";
        promptSC.message = `The '${shortcutName}' shortcut was not found.\nYou will need this shortcut on iOS.`;
        promptSC.addButton(BUTTON_TEXT);
        promptSC.isCancellable = true;

        const didShow = promptSC.show();
        if (didShow && promptSC.buttonPressed === BUTTON_TEXT) {
          // Open the URL to install or show the shortcut
          app.openURL(shortcutUrl, false);
        }
        // Either user canceled or tapped "Get Shortcut"
        return false;
      } else if (objResult.status === "success") {
        if (objResult.content === undefined) {
          alert("ERROR: Invalid response from Tot Shortcut.");
          return false;
        } else {
          // Store result in a template tag we can read
          draft.setTemplateTag("tot_content", objResult.content);
          return true;
        }
      }
      return false;
    }

    /**
     * Helper: On macOS, run AppleScript to retrieve TOT content.
     * On iOS, call getTotMobile(...) with a known Shortcut name + link.
     */
    function getTotContent(totID: number): string {
      // If macOS, run AppleScript
      if (device.systemName === "macOS") {
        const scriptMac = `
          on execute(docNum)
            -- Return the text of Tot #${totID}, but with a docNum argument
            tell application "Tot"
              if docNum > (count of documents) then
                return ""
              end if
              return content of document docNum
            end tell
          end execute
        `;
        const objAS = AppleScript.create(scriptMac);
        if (objAS.execute("execute", [totID]) && objAS.lastResult) {
          return objAS.lastResult.toString();
        } else {
          console.log(objAS.lastError);
          return "";
        }
      } else {
        // On iOS, run Shortcut
        const scName = "Get Tot Content";
        const scUrl =
          "https://www.icloud.com/shortcuts/457cc01f6460436c81e15981fbf57bbf";
        const success = getTotMobile(totID, scName, scUrl);
        if (!success) {
          return "";
        }
        // If success, we read out the tot_content tag
        const fetched = draft.processTemplate("[[tot_content]]");
        return fetched || "";
      }
    }

    /**
     * 1) Prompt user: Which TOT (#1..7)?
     */
    const totPrompt = new Prompt();
    totPrompt.title = "Pick a Tot (1–7)";
    totPrompt.message = "Which Tot would you like to manage?";
    totPrompt.isCancellable = true;

    for (let i = 1; i <= 7; i++) {
      totPrompt.addButton(`Tot #${i}`);
    }

    if (!totPrompt.show()) {
      context.cancel("Canceled picking a Tot.");
      script.complete();
      return;
    }

    const chosenLabel = totPrompt.buttonPressed; // e.g. "Tot #3"
    const chosenID = parseInt(chosenLabel.replace("Tot #", ""), 10);

    /**
     * 2) Fetch current TOT content & prompt for action
     */
    const oldContent = getTotContent(chosenID) || "";
    const previewLine = (oldContent.trim().split("\n")[0] || "[empty]").trim();

    const actionPrompt = new Prompt();
    actionPrompt.title = `Manage Tot #${chosenID}`;
    actionPrompt.message = `Currently, Tot #${chosenID} begins with:\n\n“${previewLine}”\n\nWhat would you like to do?`;
    actionPrompt.isCancellable = true;

    actionPrompt.addButton("Open");
    actionPrompt.addButton("Append");
    actionPrompt.addButton("Replace");

    if (!actionPrompt.show()) {
      context.cancel("Canceled picking action.");
      script.complete();
      return;
    }

    const chosenAction = actionPrompt.buttonPressed;
    if (!chosenAction) {
      context.cancel("No action chosen.");
      script.complete();
      return;
    }

    // If user wants to open TOT, just open & done
    if (chosenAction === "Open") {
      app.openURL(`tot://${chosenID}`);
      context.cancel("User opened TOT.");
      script.complete();
      return;
    }

    /**
     * 3) Always show full preview if they plan to overwrite/append
     */
    if (oldContent.trim().length === 0) {
      alert(`Tot #${chosenID} is currently empty.`);
    } else {
      const showPrompt = new Prompt();
      showPrompt.title = `Preview of Tot #${chosenID}`;
      showPrompt.message = `--- BEGIN CONTENT ---\n${oldContent}\n--- END CONTENT ---\n\nYou are about to ${chosenAction} this Tot. Are you sure?`;
      showPrompt.addButton("OK");
      showPrompt.addButton("Cancel");
      showPrompt.isCancellable = true;

      const didShow = showPrompt.show();
      if (!didShow || showPrompt.buttonPressed === "Cancel") {
        context.cancel("User canceled after preview.");
        script.complete();
        return;
      }
    }

    /**
     * 4) Build new content for TOT
     */
    // The main portion is our current draft content
    const newDraftText = draft.content.trim();
    // We'll embed a link + title
    const draftLink = draft.permalink;
    const draftTitle = draft.displayTitle.trim();

    const newPart = `${newDraftText}\n\n---\n${draftTitle}\n${draftLink}`;

    let finalContent = "";
    if (chosenAction === "Append") {
      // Keep old, then add new
      finalContent = oldContent.trim();
      if (finalContent.length > 0) {
        finalContent += "\n\n";
      }
      finalContent += newPart;
    } else if (chosenAction === "Replace") {
      // Just use the new text
      finalContent = newPart;
    }

    // Create tot:// link to do the replace. TOT automatically overwrites that doc.
    const totReplaceURL = `tot://${chosenID}/replace?text=${encodeURIComponent(
      finalContent
    )}`;
    app.openURL(totReplaceURL);

    // Optionally we could also do: app.openURL(`tot://${chosenID}`) to open TOT
    context.cancel("All done! Tot updated.");
    script.complete();
  } catch (error) {
    console.error("[TOTIntegration] Unexpected error:", error);
    app.displayErrorMessage("Error running TOT Integration.");
    context.fail("TOTIntegration error");
  }
}
