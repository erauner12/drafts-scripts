/* eslint-disable @typescript-eslint/no-explicit-any */
import { cancelAction, failAction } from "../../helpers/CommonFlowUtils";
import { SourceItem } from "./SourceItem";

// Import the new sub-actions
import { runDeleteTask } from "../TodoistActions/DeleteTaskAction";
import { runExportAllInformation } from "../TodoistActions/ExportAllInformationAction";
import { runOpenInBrowser } from "../TodoistActions/OpenInBrowserAction";

import { runAddOrEditComment } from "../TodoistActions/AddOrEditCommentAction";
import { runComposeChatGPTPrompt } from "../TodoistActions/ComposeChatGPTPromptAction";
import { runExportAndDelete } from "../TodoistActions/ExportAndDeleteAction";
import { runExportToNewDraft } from "../TodoistActions/ExportToNewDraftAction";
import { runOpenChatGPTClipboard } from "../TodoistActions/OpenChatGPTClipboardAction";
import { runStartSessionForEvan } from "../TodoistActions/StartSessionForEvanAction";
// ... similarly import others like runAddOrEditComment, runExportToNewDraft, etc.

declare var app: App;
declare var draft: Draft;
declare var device: Device;

export class TodoistTask extends SourceItem {
  private taskId: string;
  private todoist: Todoist;

  constructor(draft: Draft, selectedText: string, taskId: string) {
    super(draft, selectedText);
    this.taskId = taskId;
    this.todoist = Todoist.create("Todoist");
  }

  // Example "performAction" method now calls out to each sub-action
  public async performAction(): Promise<void> {
    try {
      console.log("TodoistTask performAction started.");
      const p = new Prompt();
      p.title = "Todoist Task Actions";
      p.message = "What would you like to do?";

      p.addButton("Open in Browser");
      p.addButton("Export All Information");
      // p.addButton("AI Actions");    // We'll add for AI usage
      // p.addButton("Add or Edit Comment");
      // p.addButton("Export to New Draft");
      // p.addButton("Export and Delete");
      // p.addButton("Open ChatGPT (Clipboard)");
      p.addButton("Open in Browser");
      p.addButton("Export All Information");
      p.addButton("Add or Edit Comment");
      p.addButton("Export to New Draft");
      p.addButton("Export and Delete");
      p.addButton("Open ChatGPT (Clipboard)");
      p.addButton("Compose ChatGPT Prompt");
      p.addButton("Start Session for Evan");
      p.addButton("Delete Task");
      p.addButton("Cancel");

      const result = p.show();
      if (!result || p.buttonPressed === "Cancel") {
        console.log("User cancelled the action.");
        cancelAction("User cancelled adding comment");
        return;
      }

      console.log(
        "User selected action:",
        p.buttonPressed,
        "on TodoistTask performAction."
      );

      switch (p.buttonPressed) {
        case "Open in Browser":
          runOpenInBrowser(this.taskId);
          break;

        case "Export All Information": {
          runExportAllInformation(this.todoist, this.taskId);
          break;
        }

        case "Add or Edit Comment":
          await runAddOrEditComment(
            this.todoist,
            this.taskId,
            this.selectedText
          );
          break;

        case "Export to New Draft":
          await runExportToNewDraft(this.todoist, this.taskId);
          break;

        case "Export and Delete":
          {
            const exportDeletePrompt = new Prompt();
            exportDeletePrompt.title = "Confirm Export and Delete";
            exportDeletePrompt.message =
              "This will export the task to a new draft and then delete it. Continue?";
            exportDeletePrompt.addButton("Yes");
            exportDeletePrompt.addButton("Cancel");

            if (
              exportDeletePrompt.show() &&
              exportDeletePrompt.buttonPressed === "Yes"
            ) {
              await runExportAndDelete(this.todoist, this.taskId);
            }
          }
          break;

        case "Open ChatGPT (Clipboard)":
          {
            const fullContext = runExportAllInformation(
              this.todoist,
              this.taskId
            );
            if (fullContext) {
              runOpenChatGPTClipboard(fullContext);
            }
          }
          break;

        case "Compose ChatGPT Prompt":
          await runComposeChatGPTPrompt(
            this.todoist,
            this.taskId,
            this.selectedText
          );
          break;

        case "Start Session for Evan":
          await runStartSessionForEvan(this.todoist, this.taskId);
          break;

        case "Delete Task":
        // Additional actions would call out to their separate functions:
        // case "Add or Edit Comment":
        //   runAddOrEditComment(this.todoist, this.taskId, this.selectedText);
        //   break;
        // case "Export to New Draft":
        //   runExportToNewDraft(this.todoist, this.taskId);
        //   break;
        // case "Export and Delete":
        //   ...
        //   break;
        // case "Open ChatGPT (Clipboard)":
        //   ...
        //   break;
        // case "Compose ChatGPT Prompt":
        //   ...
        //   break;
        // case "Start Session for Evan":
        //   ...
        //   break;

        case "Delete Task":
          {
            const deletePrompt = new Prompt();
            deletePrompt.title = "Confirm Delete";
            deletePrompt.message =
              "Are you sure you want to delete this task? This cannot be undone.";
            deletePrompt.addButton("Yes");
            deletePrompt.addButton("Cancel");

            if (deletePrompt.show() && deletePrompt.buttonPressed === "Yes") {
              runDeleteTask(this.todoist, this.taskId);
            }
          }
          break;

        default:
          console.log("Unknown action selected.");
          cancelAction("User cancelled the action");
      }
    } catch (error) {
      console.error("Error in TodoistTask performAction:", error);
      app.displayErrorMessage("An error occurred during Todoist action.");
      failAction("Failed to retrieve GitHub item details");
    }
  }
}
