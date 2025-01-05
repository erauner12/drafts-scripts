/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SourceItem.ts
 *
 * Abstract base class representing a generic source type,
 * plus the shared method for appending AI results to the draft.
 */

import { cancelAction, failAction } from "../../helpers/CommonFlowUtils";

declare var app: App;
declare var draft: Draft;
declare var device: Device;

export abstract class SourceItem {
  protected draft: Draft;
  protected selectedText: string;

  constructor(draft: Draft, selectedText: string) {
    this.draft = draft;
    this.selectedText = selectedText;
  }

  // Each subclass must implement an action method
  abstract performAction(): Promise<void>;

  /**
   * appendAIResultToDraft
   *
   * Presents a prompt for user to choose an AI action (e.g. Summarize, Next Steps).
   * Calls OpenAI and appends the result to the draft or inserts next actions.
   */
  public async appendAIResultToDraft(contextText: string): Promise<void> {
    try {
      console.log("Entering appendAIResultToDraft...");
      console.log("Context Text Length:", contextText.length);

      const aiActionPrompt = new Prompt();
      aiActionPrompt.title = "AI Actions";
      aiActionPrompt.message = "Select an AI action to perform:";
      aiActionPrompt.addButton("Summarize Task History");
      aiActionPrompt.addButton("Suggest Next Steps");
      aiActionPrompt.addButton("Generate Response");
      aiActionPrompt.addButton("Generate Next Actions");
      aiActionPrompt.addButton("Summarize Current State");
      aiActionPrompt.addButton("Cancel");

      const aiActionResult = aiActionPrompt.show();
      if (!aiActionResult || aiActionPrompt.buttonPressed === "Cancel") {
        console.log("AI action prompt cancelled by user.");
        cancelAction("User cancelled AI action");
        return;
      }

      console.log("AI action selected:", aiActionPrompt.buttonPressed);

      let aiPrompt: string;
      switch (aiActionPrompt.buttonPressed) {
        case "Generate Next Actions":
          aiPrompt = `What is the most reasonable next action based on the information presented?

### Task Context:
${contextText}

### Instructions:
Please provide a concise and clear set of actions that should be taken next. Format your response as a paragraph followed by bullet points. Ensure the suggestions are prescriptive and instructive based on the provided context.`;
          break;
        case "Summarize Current State":
          aiPrompt = `Provide a concise summary of the current state and progress of this task, highlighting:
- Key decisions made
- Current blockers or dependencies
- Main objectives still to be achieved

### Task History:
${contextText}`;
          break;
        case "Summarize Task History":
          aiPrompt = `Summarize the following task history, including key events and outcomes:

### Task History:
${contextText}`;
          break;
        case "Suggest Next Steps":
          aiPrompt = `Based on the following task history, suggest the next steps:

### Task History:
${contextText}`;
          break;
        case "Generate Response":
          aiPrompt = `Based on the following task history, generate a response that addresses the main points:

### Task History:
${contextText}`;
          break;
        default:
          console.log("Unknown AI action selected.");
          cancelAction("Unknown AI action selected");
          return;
      }

      console.log("AI Prompt prepared.");
      const ai = OpenAI.create();
      ai.model = "gpt-4o-mini"; // or your chosen model
      const aiResponse = await ai.quickChatResponse(aiPrompt);
      console.log("AI response received.");

      if (!aiResponse || aiResponse.trim() === "") {
        console.error("AI response is empty.");
        app.displayErrorMessage("AI did not return a response.");
        failAction("Failed to process AI response");
        return;
      }

      if (aiActionPrompt.buttonPressed === "Generate Next Actions") {
        const suggestedActions = aiResponse
          .split("\n\n")
          .filter((action) => action.trim().length > 0);
        console.log("Parsed actions:", suggestedActions);

        let formattedContent = "\n";
        for (const action of suggestedActions) {
          let lines = action.split("\n");
          let taskLine = lines[0]
            .replace(
              /^Title:\s*|^[-*•\d.]\s*|Subtask:\s*|\[[ x]\]|\s*\/\/.*$/gi,
              ""
            )
            .trim();
          taskLine = `- [ ] ${taskLine}`;
          if (!taskLine.includes("//")) {
            taskLine += " // today";
          }

          formattedContent += `${taskLine}\n`;

          // Add remaining lines, preserving * and - prefixes
          for (let i = 1; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line) {
              if (!line.startsWith("*") && !line.startsWith("-")) {
                // Convert unprefixed lines to a bullet
                line = "* " + line;
              }
              formattedContent += `${line}\n`;
            }
          }

          formattedContent += "\n";
        }

        console.log("Appending formatted content:", formattedContent);
        this.draft.content += formattedContent;
        this.draft.update();
        app.displaySuccessMessage("Next actions added to draft.");
      } else {
        console.log("Appending AI response to draft.");
        const separator = "\n\n---\n\n";
        this.draft.content += separator + aiResponse.trim() + "\n";
        this.draft.update();
        app.displaySuccessMessage("AI response appended to draft.");
      }
    } catch (error) {
      console.error("Error in appendAIResultToDraft:", error);
      app.displayErrorMessage("An error occurred during AI processing.");
      failAction("Failed to process AI response");
    }
  }
}
