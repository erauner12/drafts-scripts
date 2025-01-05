import { failAction } from "../../helpers/CommonFlowUtils";

declare var app: App;
declare var device: Device;

export function runOpenChatGPTClipboard(refinedPrompt: string): void {
  try {
    console.log(
      "openChatGPTWithClipboard: Called with refinedPrompt length =",
      refinedPrompt.length
    );

    const existingClipboard = app.getClipboard();
    console.log(
      "openChatGPTWithClipboard: Current clipboard length =",
      existingClipboard ? existingClipboard.length : 0
    );

    // Consolidate into one template literal
    const messageText = `You have a refined prompt and possibly existing clipboard text.

Refined Prompt length: ${refinedPrompt.length}
Existing Clipboard length: ${
      existingClipboard ? existingClipboard.length : 0
    }`;

    const prompt = new Prompt();
    prompt.title = "Open ChatGPT?";
    prompt.message = messageText;

    prompt.addLabel("lbl1", "Refined Prompt:");
    prompt.addTextView("refined", "", refinedPrompt, { height: 80 });
    prompt.addLabel("lbl2", "Existing Clipboard:");
    prompt.addTextView("clip", "", existingClipboard || "", { height: 80 });

    prompt.addButton("Merge & Copy");
    prompt.addButton("Use Only Refined", undefined, true);
    prompt.addButton("Cancel");

    const didShow = prompt.show();
    if (!didShow || prompt.buttonPressed === "Cancel") {
      console.log(
        "openChatGPTWithClipboard: User canceled the ChatGPT open action."
      );
      return;
    }

    let finalText = "";
    if (prompt.buttonPressed === "Merge & Copy") {
      console.log(
        "openChatGPTWithClipboard: Merging refinedPrompt with existingClipboard..."
      );
      finalText = refinedPrompt + "\n\n---\n\n" + (existingClipboard || "");
    } else {
      console.log("openChatGPTWithClipboard: Using only refined prompt...");
      finalText = refinedPrompt;
    }

    console.log("openChatGPTWithClipboard: finalText length =", finalText.length);
    app.setClipboard(finalText);
    console.log("openChatGPTWithClipboard: Clipboard updated.");

    let chatGPTUrl =
      device.systemName === "iOS"
        ? "googlechrome://chat.openai.com/chat"
        : "https://chat.openai.com/chat";

    app.openURL(chatGPTUrl);
    console.log(
      "openChatGPTWithClipboard: ChatGPT opened. User can paste final text."
    );
    app.displaySuccessMessage(
      "Context copied. ChatGPT opened—paste it there as needed."
    );
  } catch (err) {
    console.error("openChatGPTWithClipboard: Error merging or opening ChatGPT:", err);
    failAction("Error merging or opening ChatGPT", err);
  }
}