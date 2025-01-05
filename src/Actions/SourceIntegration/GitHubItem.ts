/* eslint-disable @typescript-eslint/no-explicit-any */
import { cancelAction, failAction } from "../../helpers/CommonFlowUtils";
import { SourceItem } from "./SourceItem";

declare var app: App;
declare var draft: Draft;
declare var device: Device;

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
      console.log("GitHub token not found or not authorized.");
      return null;
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
      if (!token) {
        failAction("GitHub token not authorized or missing.");
        return null;
      }

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
