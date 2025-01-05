/* eslint-disable @typescript-eslint/no-explicit-any */
import { cancelAction, failAction } from "../../helpers/CommonFlowUtils";
import { SourceItem } from "./SourceItem";

declare var app: App;
declare var draft: Draft;

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
        cancelAction("User canceled the action");
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
      const taskDescription = `Jira Issue: ${this.issueKey}\nLink: ${jiraIssueLink}\nDraft: ${draftLink}`;

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
