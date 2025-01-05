/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SourceIntegration.ts
 *
 * This file integrates a flexible "SourceItem" concept with specialized implementations
 * for Todoist (TodoistTask), Jira (JiraIssue), and GitHub (GitHubItem).
 * It should be placed in your TypeScript repo, e.g. src/Actions/SourceIntegration.ts,
 * and can be invoked in a Drafts action like:
 *
 *    require("custom-scripts/drafts-actions.js");
 *    runSourceIntegration();
 *
 * or integrated into your existing Executor / ManageDraftFlow pipeline.
 *
 * Dependencies: The following references rely on typed definitions in your
 * "drafts-type-individual" folder or similar:
 *   - app, editor, draft, script, context
 *   - Credential, Prompt, HTTP, device
 *   - OpenAI, Todoist, etc.
 *
 * For advanced usage, you may incorporate the "appendAIResultToDraft" and other
 * AI methods with your own OpenAI flows, or modify them to use your local LLM approach.
 */

import {
  cancelAction,
  failAction,
  quickAlert,
} from "../helpers/CommonFlowUtils";

declare var app: App;
declare var editor: Editor;
declare var draft: Draft;
declare var device: Device;
declare var context: Context;
declare var script: Script;
declare var device: Device;
/**
 * Represents the Credential constructor and static methods.
 * Credential objects can be used to securely store and manage authentication credentials
 * for services that require username, password, and optional host information.
 *
 * @example
 * ```javascript
 * // Create basic credential
 * const cred = new Credential("MyService", "Service description");
 *
 * // Create via static method
 * const credWithUserPass = Credential.createWithUsernamePassword(
 *   "MyService",
 *   "Service description"
 * );
 * ```
 */
// remove or comment out existing 'declare var Credential' block
// ...existing code...
/**
 * Credential objects can be used in actions which require the user to provide a username, password and optionally a host name, to connect to a service. By using credentials objects, actions can be written to connect to arbitrary web services without hard coding credentials into the action.
 *
 * When an authorize() call is made on a credential object for the first time, the user is prompted to enter their credentials, then Drafts stores those for later use. When the action is used again, there will be no prompt required and the stored credentials will be used.
 *
 * Credentials objects have unique identifiers, and a single set of user credentials can be used across actions by using the same identifier.
 *
 * The user can delete those credentials at any time by visiting Settings > Credentials and tapping the "Forget" button on a service.
 *
 * @example
 *
 * ```javascript
 * let credential = Credential.create("My Service", "Description of the service to  * appear in user prompt.");
 *
 * credential.addTextField("username", "Username");
 * credential.addPasswordField("password", "Password");
 *
 * credential.authorize();
 *
 * let http = HTTP.create();
 * let response = http.request({
 *   "url": "http://myurl.com/api",
 *   "username": credential.getValue("username"),
 *   "password": credential.getValue("password"),
 *   "method": "POST",
 *   "data": {
 *     "key":"value"
 *   },
 *   "headers": {
 *     "HeaderName": "HeaderValue"
 *   }
 * });
 *
 * ```
 */
declare class Credential {
  /**
   * Create a credential object with the specified identifier and description. Identifiers should be unique, such that any two calls from different actions with the same identifier will return the same credentials
   * @param identifier Unique identifier for the credentials
   * @param description Optional description
   */
  static create(identifier: string, description?: string): Credential;

  /**
   * Create credential already configured with username and password fields.
   * @param identifier Unique identifier for the credentials
   * @param description Optional description
   */
  static createWithUsernamePassword(
    identifier: string,
    description: string
  ): Credential;

  /**
   * Create credential already configured with host url, username and password fields.
   * @param identifier Unique identifier for the credentials
   * @param description Optional description
   */
  static createWithHostUsernamePassword(
    identifier: string,
    description: string
  ): Credential;

  /**
   * Create new instance.
   * @param identifier Unique identifier for the credentials
   * @param description Optional description
   */
  constructor(identifier: string, description?: string);

  /**
   * Call this function after configuring, but before using host, username or password properties of a credential. If the credential object has not be previous authorized, the user will be prompted to enter their credentials before continuing. If the user has previously been prompt, this method will load previously provided information.
   */
  authorize(): boolean;

  /**
   * Get the value the user stored for the key, as defined in a call to add the field.
   */
  getValue(key: string): string;

  /**
   * Add a text field for data entry.
   * @param key used to retrieve the value
   * @param label label is displayed to the user
   */
  addTextField(key: string, label: string): void;

  /**
   * Add a secure entry text field for data entry.
   * @param key used to retrieve the value
   * @param label label is displayed to the user
   */
  addPasswordField(key: string, label: string): void;

  /**
   * Add a text field for configured for URL data entry.
   * @param key used to retrieve the value
   * @param label label is displayed to the user
   */
  addURLField(key: string, label: string): void;

  /**
   * Deletes the credentials provided by the user. This is the same as the user visiting settings and tapping "Forget" for the credentials.
   */
  forget(): void;
}

// the "drafts-type-individual" .d.ts, we assume they are globally available.

/**
 * Abstract base class SourceItem:
 * Accepts a Draft object and selected text, providing a consistent interface.
 */
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
        failAction("Failed to export all task information");
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

/**
 * TodoistTask: specialized class for "task_<id>" draft titles.
 */
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

      // Show a Prompt to confirm or merge
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

      // Attempt to retrieve the task from Todoist
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

      // Prompt user to pick which details to include
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
        comments.map((comment: any) => comment.content).join("\n\n---\n\n") ||
        "No Comments";

      const notes = `${lastComment}\n\n---\n\n${title}\n\n${description}\n\n---\n\n${allComments}`;

      // Prompt user if they want to open ChatGPT just for reference
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

/**
 * JiraIssue: specialized class for "issue_<KEY>" e.g. "issue_ABC-123".
 */
export class JiraIssue extends SourceItem {
  private issueKey: string;
  private jiraCredential: Credential;

  constructor(draft: Draft, selectedText: string, issueKey: string) {
    super(draft, selectedText);
    this.issueKey = issueKey;
    this.jiraCredential = this.getJiraCredentials();
  }

  private getJiraCredentials(): Credential {
    const credential = Credential.create(
      "jira-medallia-auth",
      "Medallia Jira Login"
    );
    credential.addTextField("username", "Your Medallia username");
    credential.addPasswordField("password", "Your password");

    if (!credential.authorize()) {
      throw new Error("Failed to authorize Jira credentials");
    }
    return credential;
  }

  private openInBrowser(): void {
    const issueUrl = "https://jira.medallia.com/browse/" + this.issueKey;
    app.openURL(issueUrl);
    app.displaySuccessMessage("Opened Jira issue in browser.");
  }

  private async exportAll(): Promise<string | null> {
    try {
      console.log("Exporting Jira issue information...");
      const http = HTTP.create();
      const response = http.request({
        url: `https://jira.medallia.com/rest/api/2/issue/${this.issueKey}?expand=renderedFields`,
        method: "GET",
        username: this.jiraCredential.getValue("username"),
        password: this.jiraCredential.getValue("password"),
        headers: {
          Accept: "application/json",
        },
      });

      if (response.success) {
        const issueData = JSON.parse(response.responseText);
        let content = "### " + issueData.fields.summary + "\n\n";
        if (issueData.renderedFields.description) {
          content += issueData.renderedFields.description + "\n\n";
        }

        interface JiraComment {
          created: string;
          author: { displayName: string };
          body: string;
          content: string;
        }

        const comments = issueData.fields.comment.comments || [];
        comments.forEach((comment: JiraComment) => {
          const timestamp = new Date(comment.created).toLocaleString();
          content += "---\n\n";
          content += `#### ${timestamp} by ${comment.author.displayName}\n\n`;
          content += comment.body + "\n\n";
        });

        app.setClipboard(content);
        app.displaySuccessMessage("Issue details copied to clipboard.");
        console.log("Jira issue information exported.");
        return content;
      } else {
        console.error(
          "Failed to fetch Jira issue details:",
          response.statusCode,
          response.responseText
        );
        app.displayErrorMessage("Failed to fetch issue details from Jira.");
        failAction("Failed to fetch issue details from Jira");
        return null;
      }
    } catch (error) {
      console.error("Error in JiraIssue exportAll:", error);
      app.displayErrorMessage("An error occurred while exporting Jira issue.");
      failAction("Failed to fetch issue details from GitHub");
      return null;
    }
  }

  private async addComment(): Promise<void> {
    try {
      console.log("Adding comment to Jira issue...");
      const commentPrompt = new Prompt();
      commentPrompt.title = "Add Comment to Jira Issue";
      commentPrompt.message =
        "Enter your comment for Jira issue " + this.issueKey + ":";
      commentPrompt.addTextView("comment", "Comment", this.selectedText || "", {
        height: 100,
      });
      commentPrompt.addButton("Add Comment");
      commentPrompt.addButton("Cancel");

      const commentResult = commentPrompt.show();
      if (!commentResult || commentPrompt.buttonPressed === "Cancel") {
        console.log("User cancelled adding comment.");
        cancelAction("User cancelled the action");
        return;
      }

      const commentText = commentPrompt.fieldValues["comment"];
      const http = HTTP.create();
      const response = http.request({
        url: `https://jira.medallia.com/rest/api/2/issue/${this.issueKey}/comment`,
        method: "POST",
        username: this.jiraCredential.getValue("username"),
        password: this.jiraCredential.getValue("password"),
        data: {
          body: commentText,
        },
        encoding: "json",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.success || response.statusCode === 201) {
        app.displaySuccessMessage(
          "Comment added to Jira issue " + this.issueKey
        );
        console.log("Comment added to Jira issue.");
      } else {
        console.error(
          "Failed to add comment to Jira issue:",
          response.statusCode,
          response.responseText
        );
        app.displayErrorMessage("Failed to add comment to Jira issue.");
        failAction("Failed to add comment to Jira issue");
      }
    } catch (error) {
      console.error("Error in addComment:", error);
      app.displayErrorMessage("An error occurred while adding comment.");
      failAction("Failed to add comment to GitHub item");
    }
  }

  private async createTodoistTask(): Promise<void> {
    try {
      console.log("Creating Todoist task from Jira issue...");
      const taskNamePrompt = new Prompt();
      taskNamePrompt.title = "Create Todoist Task";
      taskNamePrompt.message =
        "Enter task name for Todoist task based on Jira issue " +
        this.issueKey +
        ":";
      taskNamePrompt.addTextField(
        "task_name",
        "Task Name",
        this.selectedText || "Work on " + this.issueKey
      );
      taskNamePrompt.addButton("Create Task");
      taskNamePrompt.addButton("Cancel");

      const taskNameResult = taskNamePrompt.show();
      if (!taskNameResult || taskNamePrompt.buttonPressed === "Cancel") {
        console.log("User cancelled creating Todoist task.");
        cancelAction("User cancelled adding comment");
        return;
      }

      const taskName = taskNamePrompt.fieldValues["task_name"];
      const todoist = Todoist.create("Todoist");
      const jiraIssueLink = "https://jira.medallia.com/browse/" + this.issueKey;
      const draftLink =
        "drafts://x-callback-url/open?title=issue_" +
        encodeURIComponent(this.issueKey) +
        "&allowCreate=true";
      const taskDescription =
        "Jira Issue: " +
        this.issueKey +
        "\nLink: " +
        jiraIssueLink +
        "\nDraft: " +
        draftLink;

      const result = todoist.createTask({
        content: taskName,
        description: taskDescription,
      });

      if (result) {
        const taskId = result.id;
        app.displaySuccessMessage("Todoist task created with ID " + taskId);
        console.log("Todoist task created.");
      } else {
        console.error("Failed to create Todoist task:", todoist.lastError);
        app.displayErrorMessage("Failed to create Todoist task.");
        failAction("Failed to create Todoist task");
      }
    } catch (error) {
      console.error("Error in createTodoistTask:", error);
      app.displayErrorMessage("An error occurred while creating Todoist task.");
      failAction("Failed to export GitHub item");
    }
  }

  public async performAction(): Promise<void> {
    try {
      console.log("JiraIssue performAction started.");
      const p = new Prompt();
      p.title = "Jira Issue Actions";
      p.message =
        "What would you like to do with Jira issue " + this.issueKey + "?";

      p.addButton("Open in Browser");
      p.addButton("Export All Information");
      p.addButton("AI Actions");
      p.addButton("Create Todoist Task");
      p.addButton("Add Comment");
      p.addButton("Cancel");

      const result = p.show();
      if (!result || p.buttonPressed === "Cancel") {
        console.log("User cancelled the action.");
        cancelAction("User canceled the action");
        return;
      }

      console.log("User selected action:", p.buttonPressed);

      switch (p.buttonPressed) {
        case "Open in Browser":
          this.openInBrowser();
          break;
        case "Export All Information": {
          const content = await this.exportAll();
          if (content) {
            console.log("Jira issue content exported.");
          }
          break;
        }
        case "AI Actions": {
          const contextText = await this.exportAll();
          if (contextText) {
            await this.appendAIResultToDraft(contextText);
          }
          break;
        }
        case "Create Todoist Task":
          await this.createTodoistTask();
          break;
        case "Add Comment":
          await this.addComment();
          break;
        default:
          console.log("Unknown action selected.");
          cancelAction("User canceled the action");
      }
    } catch (error) {
      console.error("Error in JiraIssue performAction:", error);
      app.displayErrorMessage("An error occurred during Jira action.");
      failAction("Failed to fetch GitHub item details");
    }
  }
}

/**
 * GitHubItem: specialized class for 'issue' / 'pr' / 'gist' handling.
 */
export class GitHubItem extends SourceItem {
  private identifier: string;
  private itemType: string; // 'pr', 'issue', or 'gist'

  constructor(
    draft: Draft,
    selectedText: string,
    identifier: string,
    itemType: string
  ) {
    super(draft, selectedText);
    this.identifier = identifier;
    this.itemType = itemType;
  }

  private getGitHubToken(): string | null {
    const credential = new Credential("github-auth", "GitHub Authentication");
    credential.addPasswordField("token", "GitHub Personal Access Token");

    if (credential.authorize()) {
      console.log("GitHub token loaded successfully.");
      return credential.getValue("token");
    } else {
      console.log("GitHub token not found. Prompting user for token.");
      credential.authorize();
      if (credential.authorize()) {
        console.log("GitHub token saved successfully.");
        return credential.getValue("token");
      } else {
        console.error("Failed to save GitHub token.");
        app.displayErrorMessage("Failed to save GitHub token.");
        return null;
      }
    }
  }

  private openInBrowser(): void {
    const baseUrl = "https://github.medallia.com/";
    let url = "";

    if (this.itemType === "pr") {
      const parts = this.identifier.split("_");
      if (parts.length === 3) {
        const [projectKey, repoName, prNumber] = parts;
        url = `${baseUrl}${projectKey}/${repoName}/pull/${prNumber}`;
      }
    } else if (this.itemType === "issue") {
      const parts = this.identifier.split("_");
      if (parts.length === 3) {
        const [projectKey, repoName, issueNumber] = parts;
        url = `${baseUrl}${projectKey}/${repoName}/issues/${issueNumber}`;
      }
    } else if (this.itemType === "gist") {
      url = `${baseUrl}gist/${this.identifier}`;
    }

    if (url) {
      app.openURL(url);
      app.displaySuccessMessage("Opened GitHub item in browser.");
    } else {
      console.error(
        "Unable to construct GitHub URL for identifier:",
        this.identifier
      );
      app.displayErrorMessage("Unable to construct GitHub URL.");
      cancelAction("Failed to fetch GitHub item details");
    }
  }

  private async exportAll(): Promise<string | null> {
    try {
      const token = this.getGitHubToken();
      if (!token) return null;

      const http = HTTP.create();
      http.timeout = 5;

      let apiUrl = "";
      if (this.itemType === "issue" || this.itemType === "pr") {
        const [owner, repo, number] = this.identifier.split("_");
        apiUrl = `https://api.github.com/repos/${owner}/${repo}/${this.itemType}s/${number}`;
      } else if (this.itemType === "gist") {
        apiUrl = `https://api.github.com/gists/${this.identifier}`;
      }

      const response = http.request({
        url: apiUrl,
        method: "GET",
        headers: {
          Authorization: "token " + token,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.success) {
        console.log("GitHub API request successful.");
        const data = JSON.parse(response.responseText);
        let content = "";

        if (this.itemType === "issue" || this.itemType === "pr") {
          content += `### ${data.title}\n\n${data.body || ""}\n\n`;

          const commentsUrl = data.comments_url;
          const commentsResponse = http.request({
            url: commentsUrl,
            method: "GET",
            headers: {
              Authorization: "token " + token,
              Accept: "application/vnd.github.v3+json",
            },
          });

          if (commentsResponse.success) {
            const comments = JSON.parse(commentsResponse.responseText);
            comments.forEach((comment: any) => {
              const timestamp = new Date(comment.created_at).toLocaleString();
              content += `---\n\n#### ${timestamp} by ${comment.user.login}\n\n${comment.body}\n\n`;
            });
          }
        } else if (this.itemType === "gist") {
          for (const filename in data.files) {
            const file = data.files[filename];
            content += `### ${filename}\n\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
          }
        }

        app.setClipboard(content);
        app.displaySuccessMessage("GitHub item details copied to clipboard.");
        return content;
      } else {
        console.error(
          "Failed to fetch GitHub item:",
          response.statusCode,
          response.responseText
        );
        app.displayErrorMessage("Failed to fetch GitHub item from GitHub API.");
        failAction("Failed to fetch GitHub item details");
        return null;
      }
    } catch (error) {
      console.error("Error in GitHubItem.exportAll:", error);
      app.displayErrorMessage("An error occurred while exporting GitHub item.");
      failAction("Failed to fetch GitHub item details");
      return null;
    }
  }

  public async performAction(): Promise<void> {
    try {
      console.log("GitHubItem performAction started for type:", this.itemType);
      const p = new Prompt();
      p.title = "GitHub Item Actions";
      p.message = "What would you like to do with this GitHub item?";

      p.addButton("Open in Browser");
      p.addButton("Export All Information");
      p.addButton("AI Actions");
      p.addButton("Cancel");

      const result = p.show();
      if (!result || p.buttonPressed === "Cancel") {
        console.log("User cancelled the action.");
        cancelAction("User canceled the action");
        return;
      }

      switch (p.buttonPressed) {
        case "Open in Browser":
          this.openInBrowser();
          break;
        case "Export All Information": {
          const content = await this.exportAll();
          if (content) {
            console.log("GitHub item content exported.");
          }
          break;
        }
        case "AI Actions": {
          const contextText = await this.exportAll();
          if (contextText) {
            await this.appendAIResultToDraft(contextText);
          }
          break;
        }
        default:
          console.log("Unknown action selected.");
          cancelAction("User canceled the action");
      }
    } catch (error) {
      console.error("Error in GitHubItem performAction:", error);
      app.displayErrorMessage("An error occurred during GitHub action.");
      failAction("Failed to fetch GitHub item details");
    }
  }
}

/**
 * MAIN SCRIPT LOGIC
 *
 * We provide a function runSourceIntegration() to replicate the "main script logic"
 * originally in the JavaScript version. It identifies the source type from the
 * draft.title, instantiates the correct class, and calls performAction().
 *
 * Usage in Drafts:
 *    require("custom-scripts/drafts-actions.js");
 *    runSourceIntegration();
 */

export async function runSourceIntegration(): Promise<void> {
  try {
    console.log("SourceIntegration: script started.");
    const title = draft.title;
    let selectedText = editor.getSelectedText();
    if (!selectedText) {
      const range = editor.getSelectedLineRange();
      selectedText = editor.getTextInRange(range[0], range[1]);
    }

    console.log("Draft title:", title);
    console.log(
      "Selected text length:",
      selectedText ? selectedText.length : 0
    );

    interface ITaskInfo {
      sourceType: string | null;
      identifier: string | null;
      itemType?: string;
    }
    const taskInfo: ITaskInfo = {
      sourceType: null,
      identifier: null,
    };

    const patterns = {
      todoist: /^task_(\d+)$/,
      jira: /^issue_([A-Z]+-\d+)$/,
      // Extend as needed for GitHub items or other patterns
      // e.g. for GitHub we might have: /^(ghissue_.*)$ or custom approach
    };

    if (!title || title.trim() === "") {
      console.log("Draft title is empty or undefined.");
      app.displayWarningMessage("Draft title is missing.");
      cancelAction("No recognized patterns found");
      return;
    }

    // Basic patterns for Todoist or Jira
    if (patterns.todoist.test(title)) {
      taskInfo.sourceType = "todoist";
      const match = title.match(patterns.todoist);
      taskInfo.identifier = match ? match[1] : null;
      console.log("Source type identified as Todoist:", taskInfo.identifier);
    } else if (patterns.jira.test(title)) {
      taskInfo.sourceType = "jira";
      const match = title.match(patterns.jira);
      taskInfo.identifier = match ? match[1] : null;
      console.log("Source type identified as Jira:", taskInfo.identifier);
    } else {
      console.log(
        "Draft title does not match known patterns. Attempting GitHub..."
      );

      // Optionally, check if the draft matches a GitHub item pattern
      // e.g. issue_something_repo_123 for issues, or pr_something_repo_567 for PR
      // or gist_xxxxx. We'll illustrate a simpler approach:
      const ghPattern = /^(ghissue|ghpr|ghgist)_(.*)$/;
      const match = ghPattern.exec(title);
      if (match) {
        taskInfo.sourceType = "github";
        if (match[1] === "ghissue") {
          taskInfo.itemType = "issue";
        } else if (match[1] === "ghpr") {
          taskInfo.itemType = "pr";
        } else if (match[1] === "ghgist") {
          taskInfo.itemType = "gist";
        }
        taskInfo.identifier = match[2];
        console.log(
          `Source type identified as GitHub: itemType=${taskInfo.itemType}, identifier=${taskInfo.identifier}`
        );
      }
    }

    if (!taskInfo.sourceType || !taskInfo.identifier) {
      // If we still can't identify a source
      console.log("Draft title does not match recognized patterns.");
      app.displayWarningMessage(
        "This draft is not linked to a recognized task/issue."
      );
      cancelAction("No recognized patterns found");
      return;
    }

    let sourceItem: SourceItem | undefined = undefined;
    switch (taskInfo.sourceType) {
      case "todoist":
        sourceItem = new TodoistTask(draft, selectedText, taskInfo.identifier);
        break;
      case "jira":
        sourceItem = new JiraIssue(draft, selectedText, taskInfo.identifier);
        break;
      case "github":
        if (taskInfo.itemType) {
          sourceItem = new GitHubItem(
            draft,
            selectedText,
            taskInfo.identifier,
            taskInfo.itemType
          );
        }
        break;
      default:
        console.log("Unknown source type.");
        app.displayWarningMessage("Unable to process the draft.");
        cancelAction("No recognized patterns found");
        return;
    }

    if (sourceItem) {
      console.log(
        "Performing action for source item of type:",
        taskInfo.sourceType
      );
      await sourceItem.performAction();
    } else {
      console.log("Source item is undefined (possibly missing itemType?).");
      app.displayWarningMessage("Unable to process the draft.");
      cancelAction("User canceled the prompt");
    }
  } catch (error) {
    console.error("Error in runSourceIntegration main script:", error);
    app.displayErrorMessage("An unexpected error occurred.");
    failAction("Failed to authorize credentials");
  } finally {
    console.log("SourceIntegration: script completed.");
    script.complete();
  }
}
