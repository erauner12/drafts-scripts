/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  cancelAction,
  failAction,
  quickAlert,
} from "../../helpers/CommonFlowUtils";
import { SourceItem } from "./SourceItem";

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

  private openInBrowser(): void {
    const taskUrl = "https://todoist.com/showTask?id=" + this.taskId;
    app.openURL(taskUrl);
    app.displaySuccessMessage("Opened Todoist task in browser.");
  }

  private formatCommentsForExport(
    comments: any[],
    includeTimestamps: boolean
  ): string {
    return comments
      .map((comment) => {
        let formattedComment = "";
        if (includeTimestamps) {
          const timestamp = new Date(comment.postedAt).toLocaleString();
          formattedComment += "#### " + timestamp + "\n\n";
        }
        formattedComment += comment.content;
        return formattedComment;
      })
      .join("\n\n---\n\n");
  }

  private exportAll(): string | null {
    try {
      console.log("Exporting Todoist task information...");
      const task = this.todoist.getTask(this.taskId) as {
        id: string;
        content: string;
        description?: string;
      };
      const comments = this.todoist.getComments({ task_id: this.taskId });

      let content = "### " + task.content + "\n\n";
      if (task.description) {
        content += task.description + "\n\n";
      }

      content += this.formatCommentsForExport(comments, true);

      app.setClipboard(content);
      app.displaySuccessMessage("Task details copied to clipboard.");
      console.log("Todoist task information exported.");
      return content;
    } catch (error) {
      console.error("Error exporting Todoist task information:", error);
      app.displayErrorMessage(
        "An error occurred while exporting Todoist task."
      );
      failAction("Failed to get GitHub token");
      return null;
    }
  }

  private async exportToNewDraft(): Promise<boolean> {
    try {
      console.log("Exporting Todoist task to new draft...");
      const task = this.todoist.getTask(this.taskId) as {
        id: string;
        content: string;
        description?: string;
      };
      const comments = this.todoist.getComments({ task_id: this.taskId });

      let content = `# ${task.content}\n\n`;
      if (task.description) {
        content += `${task.description}\n\n`;
      }

      content += "## Task Metadata\n";
      content += `- Original Task ID: ${task.id}\n`;
      content += `- Created: ${new Date(task.createdAt).toLocaleString()}\n`;
      if (task.due) {
        content += `- Due: ${new Date(task.due.date).toLocaleString()}\n`;
      }
      if (task.priority !== 1) {
        content += `- Priority: ${task.priority}\n`;
      }

      if (comments && comments.length > 0) {
        content += "\n## Comments\n\n";
        content += this.formatCommentsForExport(comments, true);
      }

      const newDraft = Draft.create();
      newDraft.content = content;
      newDraft.addTag("archived-task");
      newDraft.update();

      app.displaySuccessMessage("Task exported to new draft successfully.");
      return true;
    } catch (error) {
      console.error("Error exporting task to draft:", error);
      quickAlert("Failed to export task to draft", String(error), true);
      return false;
    }
  }

  private async deleteTask(): Promise<boolean> {
    try {
      console.log("Deleting Todoist task...");
      const response = this.todoist.request({
        method: "DELETE",
        url: `https://api.todoist.com/rest/v2/tasks/${this.taskId}`,
      });

      if (response.success) {
        app.displaySuccessMessage("Task deleted successfully.");
        return true;
      } else {
        console.error("Failed to delete task:", response);
        app.displayErrorMessage("Failed to delete task.");
        failAction(
          "Failed to delete task. Possibly no success property from API?"
        );
        return false;
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      quickAlert("Failed to delete task.", String(error), true);
      return false;
    }
  }

  private async exportAndDeleteTask(): Promise<boolean> {
    try {
      const exported = await this.exportToNewDraft();
      if (exported) {
        const deleted = await this.deleteTask();
        if (deleted) {
          app.displaySuccessMessage("Task exported and deleted successfully.");
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error in export and delete:", error);
      failAction("Failed to export and delete task.", error);
      return false;
    }
  }

  private async addComment(): Promise<void> {
    try {
      console.log("Adding or editing comment for Todoist task...");

      const comments = this.todoist.getComments({ task_id: this.taskId });

      const options: string[] = ["Create New Comment"];
      const commentMap: { [key: string]: any } = {};
      comments.forEach((comment: any, index: number) => {
        const snippet = comment.content
          .substring(0, 30)
          .replace(/\r?\n|\r/g, " ");
        const option = `Edit Comment ${index + 1}: ${snippet}...`;
        options.push(option);
        commentMap[option] = comment;
      });

      const actionPrompt = new Prompt();
      actionPrompt.title = "Todoist Comments";
      actionPrompt.message = "Choose an option:";
      options.forEach((option) => actionPrompt.addButton(option));
      actionPrompt.addButton("Cancel");

      const actionResult = actionPrompt.show();
      if (!actionResult || actionPrompt.buttonPressed === "Cancel") {
        console.log("User cancelled comment input.");
        cancelAction("User cancelled the action");
        return;
      }

      const selectedOption = actionPrompt.buttonPressed;
      let commentText = "";
      let commentId: string | null = null;

      if (selectedOption !== "Create New Comment") {
        const comment = commentMap[selectedOption];
        commentId = comment.id;
        commentText = comment.content;
      }

      const commentPrompt = new Prompt();
      commentPrompt.title = commentId ? "Edit Comment" : "Add Comment";
      commentPrompt.message = "Enter your comment:";
      commentPrompt.addTextView("comment", "Comment", commentText, {
        height: 100,
      });
      commentPrompt.addButton("Submit");
      commentPrompt.addButton("Cancel");

      const commentResult = commentPrompt.show();
      if (!commentResult || commentPrompt.buttonPressed === "Cancel") {
        console.log("User cancelled comment input.");
        cancelAction("User cancelled the action");
        return;
      }

      commentText = commentPrompt.fieldValues["comment"];

      if (commentId) {
        const result = this.todoist.updateComment(commentId, {
          content: commentText,
        });

        if (result && result.id) {
          app.displaySuccessMessage("Comment updated on Todoist task.");
          console.log("Comment updated on Todoist task.");
        } else {
          console.error(
            "Failed to update comment on Todoist task:",
            result,
            this.todoist.lastError
          );
          app.displayErrorMessage("Failed to update comment on Todoist task.");
          failAction("An unexpected error occurred during execution");
        }
      } else {
        const result = this.todoist.createComment({
          task_id: this.taskId,
          content: commentText,
        });

        if (result && result.id) {
          app.displaySuccessMessage("Comment added to Todoist task.");
          console.log("Comment added to Todoist task.");
        } else {
          console.error(
            "Failed to add comment to Todoist task:",
            result,
            this.todoist.lastError
          );
          app.displayErrorMessage("Failed to add comment to Todoist task.");
          failAction("Failed to fetch issue details from Jira.");
        }
      }
    } catch (error) {
      console.error("Error in addComment:", error);
      app.displayErrorMessage("An error occurred while processing comment.");
      failAction("Failed to fetch GitHub item details");
    }
  }

  private openChatGPTWithClipboard(refinedPrompt: string): void {
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

      const prompt = new Prompt();
      prompt.title = "Open ChatGPT?";
      prompt.message =
        "You have a refined prompt and possibly existing clipboard text.\n\nRefined Prompt length: " +
        refinedPrompt.length +
        "\nExisting Clipboard length: " +
        (existingClipboard ? existingClipboard.length : 0);

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

      console.log(
        "openChatGPTWithClipboard: finalText length =",
        finalText.length
      );
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
      console.error(
        "openChatGPTWithClipboard: Error merging or opening ChatGPT:",
        err
      );
      failAction("Error merging or opening ChatGPT", err);
    }
  }

  private openChatGPTSimple(): void {
    let chatGPTUrl =
      device.systemName === "iOS"
        ? "googlechrome://chat.openai.com/chat"
        : "https://chat.openai.com/chat";
    app.openURL(chatGPTUrl);
    console.log("ChatGPT opened in browser/scheme.");
  }

  private async composeChatPrompt(): Promise<void> {
    try {
      console.log("composeChatPrompt: Starting method...");

      let task: any;
      try {
        task = this.todoist.getTask(this.taskId);
        console.log("composeChatPrompt: Retrieved task:", JSON.stringify(task));
      } catch (innerErr) {
        console.error(
          "composeChatPrompt: Could not retrieve task details:",
          innerErr
        );
      }

      const title = task && task.content ? task.content : "No Title";
      const description = task && task.description ? task.description : "";
      let comments: any[] = [];
      let lastComment = "";
      try {
        comments = this.todoist.getComments({ task_id: this.taskId }) || [];
        if (comments.length > 0) {
          lastComment = comments[comments.length - 1].content;
        }
      } catch (innerErr2) {
        console.error(
          "composeChatPrompt: Could not retrieve comments:",
          innerErr2
        );
      }

      console.log("composeChatPrompt: title =", title);
      console.log("composeChatPrompt: description =", description);
      console.log("composeChatPrompt: lastComment =", lastComment);

      const contextPrompt = new Prompt();
      contextPrompt.title = "Select Task Context Details";
      contextPrompt.message =
        "Choose which parts of the task context you want to include when building your final ChatGPT content.";
      contextPrompt.addSwitch("includeTitle", "Include Title", true);
      contextPrompt.addSwitch("includeDesc", "Include Description", true);
      contextPrompt.addSwitch("includeLast", "Include Last Comment", true);
      contextPrompt.addSwitch(
        "includeAllComments",
        "Include ALL Comments",
        false
      );
      contextPrompt.addButton("OK", undefined, true);
      contextPrompt.addButton("Cancel");

      const didContextShow = contextPrompt.show();
      if (!didContextShow || contextPrompt.buttonPressed === "Cancel") {
        console.log(
          "User cancelled context selection. Exiting composeChatPrompt."
        );
        return;
      }

      const optTitle = contextPrompt.fieldValues["includeTitle"];
      const optDesc = contextPrompt.fieldValues["includeDesc"];
      const optLast = contextPrompt.fieldValues["includeLast"];
      const optAll = contextPrompt.fieldValues["includeAllComments"];

      console.log("composeChatPrompt: Context selection:", {
        optTitle,
        optDesc,
        optLast,
        optAll,
      });

      let userText = this.selectedText || "";
      console.log(
        "composeChatPrompt: initial userText length =",
        userText.length
      );

      while (true) {
        console.log("composeChatPrompt: Displaying prompt for user text...");
        const prompt = new Prompt();
        prompt.title = "Compose ChatGPT Prompt";
        prompt.message = "Refine your text. Task details shown below.";

        prompt.addLabel("titleLabel", `**Task Title**: ${title}`, {
          textSize: "headline",
        });
        if (description.trim().length > 0) {
          prompt.addLabel("descLabel", `**Description**: ${description}`);
        }
        if (lastComment.trim().length > 0) {
          prompt.addLabel("commentLabel", `**Latest Comment**: ${lastComment}`);
        }

        prompt.addTextView("userPrompt", "Your Prompt", userText, {
          height: 120,
          wantsFocus: true,
        });

        prompt.addButton("Refine with AI");
        prompt.addButton("Open ChatGPT Now");
        prompt.addButton("OK", undefined, true);
        prompt.addButton("Cancel");

        const didShow = prompt.show();
        console.log(
          "composeChatPrompt: Prompt closed. buttonPressed =",
          prompt.buttonPressed
        );

        if (!didShow || prompt.buttonPressed === "Cancel") {
          console.log("User canceled Compose ChatGPT Prompt.");
          return;
        }

        userText = prompt.fieldValues["userPrompt"] || "";
        console.log(
          "composeChatPrompt: Updated userText length =",
          userText.length
        );

        if (prompt.buttonPressed === "Refine with AI") {
          console.log("composeChatPrompt: User chose to refine with AI.");
          try {
            const ai = OpenAI.create();
            ai.model = "gpt-4o-mini";
            let refinePrompt = `Please refine the following text:\n\n"${userText}"`;
            let refined = await ai.quickChatResponse(refinePrompt);
            console.log(
              "composeChatPrompt: AI refine response received. length =",
              (refined || "").length
            );

            if (refined && refined.trim() !== "") {
              userText = refined.trim();
              console.log(
                "composeChatPrompt: Updated userText after refinement."
              );
            } else {
              console.warn("No refined text returned by AI.");
              app.displayErrorMessage("No refined text returned.");
            }
          } catch (refineErr) {
            console.error(
              "composeChatPrompt: Error during AI refinement:",
              refineErr
            );
            failAction("Error during AI refinement:", refineErr);
          }
        } else if (prompt.buttonPressed === "Open ChatGPT Now") {
          console.log(
            "composeChatPrompt: User chose to open ChatGPT with current refined text."
          );

          let contextLines: string[] = [];
          contextLines.push("Refined Prompt:\n" + userText);
          contextLines.push("\n---\n\nTask Context:\n");

          if (optTitle && title.trim().length > 0) {
            contextLines.push("Title: " + title);
          }
          if (optDesc && description.trim().length > 0) {
            contextLines.push("Description: " + description);
          }

          if (optAll) {
            let allCommentText = "";
            if (comments && comments.length > 0) {
              for (let c of comments) {
                allCommentText += "- " + c.content + "\n";
              }
            } else {
              allCommentText = "(No Comments)";
            }
            contextLines.push("All Comments:\n" + allCommentText.trim());
          } else if (optLast && lastComment.trim().length > 0) {
            contextLines.push("Last Comment: " + lastComment);
          }

          let combinedForClipboard = contextLines.join("\n");
          this.openChatGPTWithClipboard(combinedForClipboard);
        } else if (prompt.buttonPressed === "OK") {
          console.log(
            "composeChatPrompt: User is satisfied with the prompt. Exiting loop."
          );
          break;
        }
      }

      let finalContextLines: string[] = [];
      finalContextLines.push(userText);
      finalContextLines.push("\n---\n\nTask Context:\n");

      if (optTitle && title.trim().length > 0) {
        finalContextLines.push("Task Title: " + title);
      }
      if (optDesc && description.trim().length > 0) {
        finalContextLines.push("Description: " + description);
      }

      if (optAll) {
        let allCommentText = "";
        if (comments && comments.length > 0) {
          for (let c of comments) {
            allCommentText += "- " + c.content + "\n";
          }
        } else {
          allCommentText = "(No Comments)";
        }
        finalContextLines.push("All Comments:\n" + allCommentText.trim());
      } else if (optLast && lastComment.trim().length > 0) {
        finalContextLines.push("Last Comment: " + lastComment);
      }

      let finalContent = finalContextLines.join("\n");
      console.log(
        "composeChatPrompt: finalContent length =",
        finalContent.length
      );

      app.setClipboard(finalContent);
      app.displaySuccessMessage("Final prompt copied to clipboard.");

      console.log("composeChatPrompt: Opening ChatGPT without injection...");
      this.openChatGPTSimple();
    } catch (err) {
      console.error("Error in composeChatPrompt:", err);
      failAction("Error during prompt composition.", err);
    }
  }

  private async startSessionForEvan(): Promise<void> {
    try {
      console.log("Starting session for Evan...");

      const task = this.todoist.getTask(this.taskId);
      if (!task) {
        quickAlert(
          "Failed to retrieve task details.",
          "Task is undefined",
          true
        );
        return;
      }

      const duration = 25; // minutes
      interface TodoistComment {
        content: string;
        posted_at: string;
      }
      const comments = this.todoist.getComments({
        task_id: this.taskId,
      }) as TodoistComment[];
      let lastComment = "";
      if (comments && comments.length > 0) {
        lastComment = comments[comments.length - 1].content;
      }

      const title = task.content || "No Title";
      const description = task.description || "No Description";
      const allComments =
        comments.map((c: any) => c.content).join("\n\n---\n\n") ||
        "No Comments";

      const notes = `${lastComment}\n\n---\n\n${title}\n\n${description}\n\n---\n\n${allComments}`;

      const createThreadPrompt = new Prompt();
      createThreadPrompt.title = "Open ChatGPT?";
      createThreadPrompt.message =
        "Do you want to open ChatGPT to brainstorm or discuss this task?";
      createThreadPrompt.addButton("Yes");
      createThreadPrompt.addButton("No");
      const threadResult = createThreadPrompt.show();

      if (threadResult && createThreadPrompt.buttonPressed === "Yes") {
        app.setClipboard(notes);
        const chatGPTUrl =
          device.systemName === "iOS"
            ? "googlechrome://chat.openai.com/chat"
            : "https://chat.openai.com/chat";
        app.openURL(chatGPTUrl);
        app.displaySuccessMessage(
          "Context copied. ChatGPT opened—paste it once you're there."
        );
      }

      const encodedIntent = encodeURIComponent(title);
      const encodedNotes = encodeURIComponent(notes);
      let sessionURL = `session:///start?intent=${encodedIntent}&duration=${duration}&notes=${encodedNotes}`;
      console.log(`Opening Session URL: ${sessionURL}`);
      app.openURL(sessionURL);

      app.displaySuccessMessage("Session started for Evan.");
    } catch (error) {
      console.error("Error in startSessionForEvan:", error);
      failAction("Failed to start session.", error);
    }
  }

  public async performAction(): Promise<void> {
    try {
      console.log("TodoistTask performAction started.");
      const p = new Prompt();
      p.title = "Todoist Task Actions";
      p.message = "What would you like to do?";

      p.addButton("Open in Browser");
      p.addButton("Export All Information");
      p.addButton("AI Actions");
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
          this.openInBrowser();
          break;
        case "Export All Information": {
          this.exportAll();
          break;
        }
        case "AI Actions": {
          const contextText = this.exportAll();
          if (contextText) {
            await this.appendAIResultToDraft(contextText);
          }
          break;
        }
        case "Add or Edit Comment":
          await this.addComment();
          break;
        case "Export to New Draft":
          await this.exportToNewDraft();
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
              await this.exportAndDeleteTask();
            }
          }
          break;
        case "Open ChatGPT (Clipboard)": {
          const fullContext = this.exportAll();
          if (fullContext) {
            this.openChatGPTWithClipboard(fullContext);
          }
          break;
        }
        case "Compose ChatGPT Prompt":
          await this.composeChatPrompt();
          break;
        case "Start Session for Evan":
          await this.startSessionForEvan();
          break;
        case "Delete Task":
          {
            const deletePrompt = new Prompt();
            deletePrompt.title = "Confirm Delete";
            deletePrompt.message =
              "Are you sure you want to delete this task? This cannot be undone.";
            deletePrompt.addButton("Yes");
            deletePrompt.addButton("Cancel");

            if (deletePrompt.show() && deletePrompt.buttonPressed === "Yes") {
              await this.deleteTask();
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
