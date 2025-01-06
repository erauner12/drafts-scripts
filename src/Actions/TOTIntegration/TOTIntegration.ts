/**
 * TOTIntegration.ts
 *
 * Note on TOT AppleScript usage:
 * ----------------------------------------------------------------------
 * The code here calls:
 *   open location "tot://<docID>/content"
 * TOT then returns the text of that tot. This may seem unusual compared
 * to typical AppleScript usage, but is intentionally based on known
 * behavior from the "Tot-ality" action group by Stephen Millard.
 * TOT doesn't provide an official "document-based" method for each tot,
 * so we rely on "open location" to retrieve content. If TOT is not
 * used for a particular dot, TOT may return empty text. This is all
 * expected behavior.
 * ----------------------------------------------------------------------
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
          on execute(docList)
            (*
              docList is a list with one text item, e.g. {"6"}.
              We just build a tot:///content URL and open it.
            *)
            if (count of docList) is 0 then
              return ""
            end if
            set docID to item 1 of docList

            tell application "Tot"
              open location "tot://" & docID & "/content"
            end tell
          end execute
        `;
        const objAS = AppleScript.create(scriptMac);

        // We'll pass an array-of-strings as a single argument. That satisfies object[] in TS.
        const docList: string[] = [totID.toString()];
        console.log(
          `[TOTIntegration] Attempting to fetch TOT content for doc ID = "${totID}"`
        );
        const success = objAS.execute("execute", [docList]);
        console.log(
          `[TOTIntegration] AppleScript execute success? ${
            success ? "Yes" : "No"
          }`
        );

        if (success) {
          if (objAS.lastResult) {
            const oldContentResult = objAS.lastResult.toString();
            const truncatedContent =
              oldContentResult.length > 300
                ? oldContentResult.substring(0, 300) + " [TRUNCATED]"
                : oldContentResult;

            console.log(
              `[TOTIntegration] TOT doc #${totID} content length: ${oldContentResult.length}`
            );
            console.log(
              `[TOTIntegration] TOT doc #${totID} raw content (truncated):\n${truncatedContent}\n`
            );
            return oldContentResult;
          } else {
            console.log(
              `[TOTIntegration] TOT doc #${totID} returned no content.`
            );
            return "";
          }
        } else {
          console.log(
            `[TOTIntegration] AppleScript error fetching TOT doc #${totID}:`,
            objAS.lastError
          );
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
      console.log("[TOTIntegration] User chose to OPEN TOT:", chosenID);
      app.openURL(`tot://${chosenID}`);
      context.cancel("User opened TOT.");
      script.complete();
      return;
    }

    console.log(
      `[TOTIntegration] TOT doc #${chosenID} content before user action:\n${oldContent}\n`
    );

    /**
     * 3) Always show full preview if they plan to overwrite/append
     */
    if (oldContent.trim().length === 0) {
      console.log(
        `[TOTIntegration] TOT doc #${chosenID} is empty from TOT's perspective.`
      );
      alert(`Tot #${chosenID} is currently empty.`);
    } else {
      console.log(
        `[TOTIntegration] TOT doc #${chosenID} has existing content:\n${oldContent}\n`
      );
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
      console.log("[TOTIntegration] About to APPEND to TOT doc:", chosenID);
      finalContent = oldContent.trim();
      if (finalContent.length > 0) {
        finalContent += "\n\n";
      }
      finalContent += newPart;

      console.log(
        "[TOTIntegration] APPEND final content (truncated if large):"
      );
      const truncatedAppend =
        finalContent.length > 300
          ? finalContent.substring(0, 300) + " [TRUNCATED]"
          : finalContent;
      console.log(truncatedAppend);
    } else if (chosenAction === "Replace") {
      console.log("[TOTIntegration] About to REPLACE TOT doc:", chosenID);
      finalContent = newPart;

      console.log(
        "[TOTIntegration] REPLACE final content (truncated if large):"
      );
      const truncatedReplace =
        finalContent.length > 300
          ? finalContent.substring(0, 300) + " [TRUNCATED]"
          : finalContent;
      console.log(truncatedReplace);
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
