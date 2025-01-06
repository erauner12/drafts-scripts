var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/Actions/TaskActions/DateTimePrompts.ts
var exports_DateTimePrompts = {};
__export(exports_DateTimePrompts, {
  pickTimeForToday: () => pickTimeForToday,
  pickFutureDate: () => pickFutureDate
});
function pickTimeForToday() {
  let timePrompt = new Prompt;
  timePrompt.title = "Set Time for Today";
  timePrompt.message = "How should this task be scheduled for today?";
  timePrompt.addButton("Early Morning (7 AM)");
  timePrompt.addButton("Late Morning (10:30 AM)");
  timePrompt.addButton("Afternoon (3 PM)");
  timePrompt.addButton("Evening (8 PM)");
  timePrompt.addButton("Morning (9 AM)");
  timePrompt.addButton("Noon (12 PM)");
  timePrompt.addButton("No Specific Time");
  timePrompt.addButton("Custom Time");
  if (!timePrompt.show())
    return null;
  switch (timePrompt.buttonPressed) {
    case "Early Morning (7 AM)":
      return "today at 7am";
    case "Late Morning (10:30 AM)":
      return "today at 10:30am";
    case "Afternoon (3 PM)":
      return "today at 3pm";
    case "Evening (8 PM)":
      return "today at 8pm";
    case "Morning (9 AM)":
      return "today at 9am";
    case "Noon (12 PM)":
      return "today at 12pm";
    case "No Specific Time":
      return "today";
    case "Custom Time": {
      let customPrompt = new Prompt;
      customPrompt.addDatePicker("time", "Select Time", new Date, {
        mode: "time"
      });
      if (customPrompt.show()) {
        let selectedTime = customPrompt.fieldValues["time"];
        let hours = selectedTime.getHours().toString().padStart(2, "0");
        let minutes = selectedTime.getMinutes().toString().padStart(2, "0");
        return `today at ${hours}:${minutes}`;
      } else {
        return null;
      }
    }
    default:
      return null;
  }
}
function pickFutureDate() {
  let datePrompt = new Prompt;
  datePrompt.title = "Move to Future Date";
  datePrompt.message = "When should this task be due?";
  datePrompt.addButton("In Two Days");
  datePrompt.addButton("In Three Days");
  datePrompt.addButton("In One Week");
  datePrompt.addButton("In Two Weeks");
  datePrompt.addButton("Tomorrow");
  datePrompt.addButton("Next Week");
  datePrompt.addButton("Custom Date");
  if (!datePrompt.show())
    return null;
  switch (datePrompt.buttonPressed) {
    case "In Two Days": {
      let twoDays = new Date;
      twoDays.setDate(twoDays.getDate() + 2);
      return { due_date: twoDays.toISOString().split("T")[0] };
    }
    case "In Three Days": {
      let threeDays = new Date;
      threeDays.setDate(threeDays.getDate() + 3);
      return { due_date: threeDays.toISOString().split("T")[0] };
    }
    case "In One Week": {
      let oneWeek = new Date;
      oneWeek.setDate(oneWeek.getDate() + 7);
      return { due_date: oneWeek.toISOString().split("T")[0] };
    }
    case "In Two Weeks": {
      let twoWeeks = new Date;
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      return { due_date: twoWeeks.toISOString().split("T")[0] };
    }
    case "Tomorrow":
      return { due_string: "tomorrow" };
    case "Next Week":
      return { due_string: "next monday" };
    case "Custom Date": {
      let customPrompt = new Prompt;
      customPrompt.addDatePicker("date", "Select Date", new Date, {
        mode: "date"
      });
      if (customPrompt.show()) {
        let selectedDate = customPrompt.fieldValues["date"];
        return { due_date: selectedDate.toISOString().split("T")[0] };
      } else {
        return null;
      }
    }
    default:
      return null;
  }
}

// src/helpers/CommonFlowUtils.ts
function failAction(message, error) {
  console.error("[FAIL ACTION]", message);
  if (error) {
    console.error("[FAIL ACTION:ERROR]", error);
  }
  app.displayErrorMessage(message);
  context.fail(message);
}
function cancelAction(message, showWarning) {
  console.log("[CANCEL ACTION]", message);
  if (showWarning) {
    app.displayWarningMessage(message);
  }
  context.cancel(message);
}
function quickAlert(title, message, isError) {
  console.log("[ALERT]", title, message);
  if (isError) {
    app.displayErrorMessage(title + ": " + message);
  } else {
    alert(title + `

` + message);
  }
}

// src/Actions/SourceIntegration/SourceItem.ts
class SourceItem {
  draft;
  selectedText;
  constructor(draft2, selectedText) {
    this.draft = draft2;
    this.selectedText = selectedText;
  }
  async appendAIResultToDraft(contextText) {
    try {
      console.log("Entering appendAIResultToDraft...");
      console.log("Context Text Length:", contextText.length);
      const aiActionPrompt = new Prompt;
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
      let aiPrompt;
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
      ai.model = "gpt-4o-mini";
      const aiResponse = await ai.quickChatResponse(aiPrompt);
      console.log("AI response received.");
      if (!aiResponse || aiResponse.trim() === "") {
        console.error("AI response is empty.");
        app.displayErrorMessage("AI did not return a response.");
        failAction("Failed to process AI response");
        return;
      }
      if (aiActionPrompt.buttonPressed === "Generate Next Actions") {
        const suggestedActions = aiResponse.split(`

`).filter((action) => action.trim().length > 0);
        console.log("Parsed actions:", suggestedActions);
        let formattedContent = `
`;
        for (const action of suggestedActions) {
          let lines = action.split(`
`);
          let taskLine = lines[0].replace(/^Title:\s*|^[-*•\d.]\s*|Subtask:\s*|\[[ x]\]|\s*\/\/.*$/gi, "").trim();
          taskLine = `- [ ] ${taskLine}`;
          if (!taskLine.includes("//")) {
            taskLine += " // today";
          }
          formattedContent += `${taskLine}
`;
          for (let i = 1;i < lines.length; i++) {
            let line = lines[i].trim();
            if (line) {
              if (!line.startsWith("*") && !line.startsWith("-")) {
                line = "* " + line;
              }
              formattedContent += `${line}
`;
            }
          }
          formattedContent += `
`;
        }
        console.log("Appending formatted content:", formattedContent);
        this.draft.content += formattedContent;
        this.draft.update();
        app.displaySuccessMessage("Next actions added to draft.");
      } else {
        console.log("Appending AI response to draft.");
        const separator = `

---

`;
        this.draft.content += separator + aiResponse.trim() + `
`;
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

// src/Actions/SourceIntegration/GitHubItem.ts
class GitHubItem extends SourceItem {
  identifier;
  itemType;
  constructor(draft2, selectedText, identifier, itemType) {
    super(draft2, selectedText);
    this.identifier = identifier;
    this.itemType = itemType;
  }
  getGitHubToken() {
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
  openInBrowser() {
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
      console.error("Unable to construct GitHub URL for identifier:", this.identifier);
      app.displayErrorMessage("Unable to construct GitHub URL.");
      cancelAction("Failed to fetch GitHub item details");
    }
  }
  async exportAll() {
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
          Accept: "application/vnd.github.v3+json"
        }
      });
      if (response.success) {
        console.log("GitHub API request successful.");
        const data = JSON.parse(response.responseText);
        let content = "";
        if (this.itemType === "issue" || this.itemType === "pr") {
          content += `### ${data.title}

${data.body || ""}

`;
          const commentsUrl = data.comments_url;
          const commentsResponse = http.request({
            url: commentsUrl,
            method: "GET",
            headers: {
              Authorization: "token " + token,
              Accept: "application/vnd.github.v3+json"
            }
          });
          if (commentsResponse.success) {
            const comments = JSON.parse(commentsResponse.responseText);
            comments.forEach((comment) => {
              const timestamp = new Date(comment.created_at).toLocaleString();
              content += `---

#### ${timestamp} by ${comment.user.login}

${comment.body}

`;
            });
          }
        } else if (this.itemType === "gist") {
          for (const filename in data.files) {
            const file = data.files[filename];
            content += `### ${filename}

\`\`\`
${file.content}
\`\`\`

`;
          }
        }
        app.setClipboard(content);
        app.displaySuccessMessage("GitHub item details copied to clipboard.");
        return content;
      } else {
        console.error("Failed to fetch GitHub item:", response.statusCode, response.responseText);
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
  async performAction() {
    try {
      console.log("GitHubItem performAction started for type:", this.itemType);
      const p = new Prompt;
      p.title = "GitHub Item Actions";
      p.message = "What would you like to do with this GitHub item?";
      p.addButton("Open in Browser");
      p.addButton("Export All Information");
      p.addButton("AI Actions");
      p.addButton("Cancel");
      const result2 = p.show();
      if (!result2 || p.buttonPressed === "Cancel") {
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

// src/Actions/SourceIntegration/JiraIssue.ts
class JiraIssue extends SourceItem {
  issueKey;
  jiraCredential;
  constructor(draft2, selectedText, issueKey) {
    super(draft2, selectedText);
    this.issueKey = issueKey;
    this.jiraCredential = this.getJiraCredentials();
  }
  getJiraCredentials() {
    const credential = Credential.create("jira-medallia-auth", "Medallia Jira Login");
    credential.addTextField("username", "Your Medallia username");
    credential.addPasswordField("password", "Your password");
    if (!credential.authorize()) {
      throw new Error("Failed to authorize Jira credentials");
    }
    return credential;
  }
  openInBrowser() {
    const issueUrl = "https://jira.medallia.com/browse/" + this.issueKey;
    app.openURL(issueUrl);
    app.displaySuccessMessage("Opened Jira issue in browser.");
  }
  async exportAll() {
    try {
      console.log("Exporting Jira issue information...");
      const http = HTTP.create();
      const response = http.request({
        url: `https://jira.medallia.com/rest/api/2/issue/${this.issueKey}?expand=renderedFields`,
        method: "GET",
        username: this.jiraCredential.getValue("username"),
        password: this.jiraCredential.getValue("password"),
        headers: {
          Accept: "application/json"
        }
      });
      if (response.success) {
        const issueData = JSON.parse(response.responseText);
        let content = "### " + issueData.fields.summary + `

`;
        if (issueData.renderedFields.description) {
          content += issueData.renderedFields.description + `

`;
        }
        const comments = issueData.fields.comment.comments || [];
        comments.forEach((comment) => {
          const timestamp = new Date(comment.created).toLocaleString();
          content += `---

`;
          content += `#### ${timestamp} by ${comment.author.displayName}

`;
          content += comment.body + `

`;
        });
        app.setClipboard(content);
        app.displaySuccessMessage("Issue details copied to clipboard.");
        console.log("Jira issue information exported.");
        return content;
      } else {
        console.error("Failed to fetch Jira issue details:", response.statusCode, response.responseText);
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
  async addComment() {
    try {
      console.log("Adding comment to Jira issue...");
      const commentPrompt = new Prompt;
      commentPrompt.title = "Add Comment to Jira Issue";
      commentPrompt.message = "Enter your comment for Jira issue " + this.issueKey + ":";
      commentPrompt.addTextView("comment", "Comment", this.selectedText || "", {
        height: 100
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
          body: commentText
        },
        encoding: "json",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      });
      if (response.success || response.statusCode === 201) {
        app.displaySuccessMessage("Comment added to Jira issue " + this.issueKey);
        console.log("Comment added to Jira issue.");
      } else {
        console.error("Failed to add comment to Jira issue:", response.statusCode, response.responseText);
        app.displayErrorMessage("Failed to add comment to Jira issue.");
        failAction("Failed to add comment to Jira issue");
      }
    } catch (error) {
      console.error("Error in addComment:", error);
      app.displayErrorMessage("An error occurred while adding comment.");
      failAction("Failed to add comment to GitHub item");
    }
  }
  async createTodoistTask() {
    try {
      console.log("Creating Todoist task from Jira issue...");
      const taskNamePrompt = new Prompt;
      taskNamePrompt.title = "Create Todoist Task";
      taskNamePrompt.message = "Enter task name for Todoist task based on Jira issue " + this.issueKey + ":";
      taskNamePrompt.addTextField("task_name", "Task Name", this.selectedText || "Work on " + this.issueKey);
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
      const draftLink = "drafts://x-callback-url/open?title=issue_" + encodeURIComponent(this.issueKey) + "&allowCreate=true";
      const taskDescription = `Jira Issue: ${this.issueKey}
Link: ${jiraIssueLink}
Draft: ${draftLink}`;
      const result2 = todoist.createTask({
        content: taskName,
        description: taskDescription
      });
      if (result2) {
        const taskId = result2.id;
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
  async performAction() {
    try {
      console.log("JiraIssue performAction started.");
      const p = new Prompt;
      p.title = "Jira Issue Actions";
      p.message = "What would you like to do with Jira issue " + this.issueKey + "?";
      p.addButton("Open in Browser");
      p.addButton("Export All Information");
      p.addButton("AI Actions");
      p.addButton("Create Todoist Task");
      p.addButton("Add Comment");
      p.addButton("Cancel");
      const result2 = p.show();
      if (!result2 || p.buttonPressed === "Cancel") {
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

// src/Actions/TOTIntegration/TOTIntegration.ts
async function runTOTIntegration() {
  try {
    let getTotMobile = function(totID, shortcutName, shortcutUrl) {
      const cb = CallbackURL.create();
      cb.baseURL = "shortcuts://run-shortcut";
      cb.addParameter("name", shortcutName);
      cb.addParameter("input", totID.toString());
      const objResult = {};
      if (cb.open()) {
        objResult.content = cb.callbackResponse.result || "";
      }
      objResult.status = cb.status;
      if (objResult.status === "error") {
        const BUTTON_TEXT = "Get Shortcut";
        const promptSC = new Prompt;
        promptSC.title = "Shortcut Not Available";
        promptSC.message = `The '${shortcutName}' shortcut was not found.
You will need this shortcut on iOS.`;
        promptSC.addButton(BUTTON_TEXT);
        promptSC.isCancellable = true;
        const didShow = promptSC.show();
        if (didShow && promptSC.buttonPressed === BUTTON_TEXT) {
          app.openURL(shortcutUrl, false);
        }
        return false;
      } else if (objResult.status === "success") {
        if (objResult.content === undefined) {
          alert("ERROR: Invalid response from Tot Shortcut.");
          return false;
        } else {
          draft.setTemplateTag("tot_content", objResult.content);
          return true;
        }
      }
      return false;
    }, getTotContent = function(totID) {
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
        const docList = [totID.toString()];
        console.log(`[TOTIntegration] Attempting to fetch TOT content for doc ID = "${totID}"`);
        const success = objAS.execute("execute", [docList]);
        console.log(`[TOTIntegration] AppleScript execute success? ${success ? "Yes" : "No"}`);
        if (success) {
          if (objAS.lastResult) {
            const oldContentResult = objAS.lastResult.toString();
            const truncatedContent = oldContentResult.length > 300 ? oldContentResult.substring(0, 300) + " [TRUNCATED]" : oldContentResult;
            console.log(`[TOTIntegration] TOT doc #${totID} content length: ${oldContentResult.length}`);
            console.log(`[TOTIntegration] TOT doc #${totID} raw content (truncated):
${truncatedContent}
`);
            return oldContentResult;
          } else {
            console.log(`[TOTIntegration] TOT doc #${totID} returned no content.`);
            return "";
          }
        } else {
          console.log(`[TOTIntegration] AppleScript error fetching TOT doc #${totID}:`, objAS.lastError);
          return "";
        }
      } else {
        const scName = "Get Tot Content";
        const scUrl = "https://www.icloud.com/shortcuts/457cc01f6460436c81e15981fbf57bbf";
        const success = getTotMobile(totID, scName, scUrl);
        if (!success) {
          return "";
        }
        const fetched = draft.processTemplate("[[tot_content]]");
        return fetched || "";
      }
    };
    const totPrompt = new Prompt;
    totPrompt.title = "Pick a Tot (1–7)";
    totPrompt.message = "Which Tot would you like to manage?";
    totPrompt.isCancellable = true;
    for (let i = 1;i <= 7; i++) {
      totPrompt.addButton(`Tot #${i}`);
    }
    if (!totPrompt.show()) {
      context.cancel("Canceled picking a Tot.");
      script.complete();
      return;
    }
    const chosenLabel = totPrompt.buttonPressed;
    const chosenID = parseInt(chosenLabel.replace("Tot #", ""), 10);
    const oldContent = getTotContent(chosenID) || "";
    const previewLine = (oldContent.trim().split(`
`)[0] || "[empty]").trim();
    const actionPrompt = new Prompt;
    actionPrompt.title = `Manage Tot #${chosenID}`;
    actionPrompt.message = `Currently, Tot #${chosenID} begins with:

“${previewLine}”

What would you like to do?`;
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
    if (chosenAction === "Open") {
      console.log("[TOTIntegration] User chose to OPEN TOT:", chosenID);
      app.openURL(`tot://${chosenID}`);
      context.cancel("User opened TOT.");
      script.complete();
      return;
    }
    console.log(`[TOTIntegration] TOT doc #${chosenID} content before user action:
${oldContent}
`);
    if (oldContent.trim().length === 0) {
      console.log(`[TOTIntegration] TOT doc #${chosenID} is empty from TOT's perspective.`);
      alert(`Tot #${chosenID} is currently empty.`);
    } else {
      console.log(`[TOTIntegration] TOT doc #${chosenID} has existing content:
${oldContent}
`);
      const showPrompt = new Prompt;
      showPrompt.title = `Preview of Tot #${chosenID}`;
      showPrompt.message = `--- BEGIN CONTENT ---
${oldContent}
--- END CONTENT ---

You are about to ${chosenAction} this Tot. Are you sure?`;
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
    const newDraftText = draft.content.trim();
    const draftLink = draft.permalink;
    const draftTitle = draft.displayTitle.trim();
    const newPart = `${newDraftText}

---
${draftTitle}
${draftLink}`;
    let finalContent = "";
    if (chosenAction === "Append") {
      console.log("[TOTIntegration] About to APPEND to TOT doc:", chosenID);
      finalContent = oldContent.trim();
      if (finalContent.length > 0) {
        finalContent += `

`;
      }
      finalContent += newPart;
      console.log("[TOTIntegration] APPEND final content (truncated if large):");
      const truncatedAppend = finalContent.length > 300 ? finalContent.substring(0, 300) + " [TRUNCATED]" : finalContent;
      console.log(truncatedAppend);
    } else if (chosenAction === "Replace") {
      console.log("[TOTIntegration] About to REPLACE TOT doc:", chosenID);
      finalContent = newPart;
      console.log("[TOTIntegration] REPLACE final content (truncated if large):");
      const truncatedReplace = finalContent.length > 300 ? finalContent.substring(0, 300) + " [TRUNCATED]" : finalContent;
      console.log(truncatedReplace);
    }
    const totReplaceURL = `tot://${chosenID}/replace?text=${encodeURIComponent(finalContent)}`;
    app.openURL(totReplaceURL);
    context.cancel("All done! Tot updated.");
    script.complete();
  } catch (error) {
    console.error("[TOTIntegration] Unexpected error:", error);
    app.displayErrorMessage("Error running TOT Integration.");
    context.fail("TOTIntegration error");
  }
}

// src/Actions/SourceIntegration/SourceActionRegistry.ts
function runTOTIntegrationAction(_item) {
  console.log("[SourceActionRegistry] Running TOT Integration now...");
  runTOTIntegration();
}
function runNoSourceFound(_item) {
  console.log("[Fallback Action] No specific source found for this item.");
  app.displayInfoMessage("No specific source found. Running fallback action.");
}
function runGenericAction(_item) {
  console.log("[Fallback Action] Some generic fallback behavior.");
  app.displayInfoMessage("Doing something generic for any draft/source.");
}
var fallbackActions = [
  {
    label: "No Specific Source Found",
    run: runNoSourceFound
  },
  {
    label: "Generic Fallback Action",
    run: runGenericAction
  },
  {
    label: "Manage TOT",
    run: runTOTIntegrationAction
  }
];
function runOpenInBrowserForTodoist(item) {
  console.log("[Todoist Action] Running open in browser for a todoist item...");
  item.appendAIResultToDraft("Pretend we do something here for browser open...");
}
function runExportAllForTodoist(item) {
  console.log("[Todoist Action] Exporting info from a todoist item...");
  item.appendAIResultToDraft("Pretend we do a full export of the item...");
}
function runOpenInBrowserForJira(item) {
  console.log("[JIRA Action] Opening a JIRA issue in browser...");
  item.appendAIResultToDraft("Pretend we do JIRA stuff here...");
}
var SourceActionRegistry = {
  todoist: [
    {
      label: "Open in Browser (Todoist)",
      run: runOpenInBrowserForTodoist
    },
    {
      label: "Export All (Todoist)",
      run: runExportAllForTodoist
    },
    {
      label: "Manage TOT",
      run: runTOTIntegrationAction
    }
  ],
  jira: [
    {
      label: "Open in Browser (JIRA)",
      run: runOpenInBrowserForJira
    }
  ],
  fallback: fallbackActions
};

// src/Actions/TodoistActions/DeleteTaskAction.ts
function runDeleteTask(todoist, taskId) {
  try {
    console.log("Deleting Todoist task...");
    const response = todoist.request({
      method: "DELETE",
      url: `https://api.todoist.com/rest/v2/tasks/${taskId}`
    });
    if (response.success) {
      app.displaySuccessMessage("Task deleted successfully.");
      return true;
    } else {
      console.error("Failed to delete task:", response);
      app.displayErrorMessage("Failed to delete task.");
      failAction("Failed to delete task. Possibly no success property from API?");
      return false;
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    quickAlert("Failed to delete task.", String(error), true);
    return false;
  }
}

// src/Actions/TodoistActions/ExportAllInformationAction.ts
function runExportAllInformation(todoist, taskId) {
  try {
    console.log("Exporting Todoist task information...");
    const task = todoist.getTask(taskId);
    const comments = todoist.getComments({ task_id: taskId });
    let content = "### " + task.content + `

`;
    if (task.description) {
      content += task.description + `

`;
    }
    content += comments.map((comment) => `#### ${new Date(comment.postedAt).toLocaleString()}

${comment.content}`).join(`

---

`);
    app.setClipboard(content);
    app.displaySuccessMessage("Task details copied to clipboard.");
    console.log("Todoist task information exported.");
    return content;
  } catch (error) {
    console.error("Error exporting Todoist task information:", error);
    app.displayErrorMessage("An error occurred while exporting Todoist task.");
    failAction("Failed to export Todoist task info");
    return null;
  }
}

// src/Actions/TodoistActions/OpenInBrowserAction.ts
function runOpenInBrowser(taskId) {
  const taskUrl = "https://todoist.com/showTask?id=" + taskId;
  app.openURL(taskUrl);
  app.displaySuccessMessage("Opened Todoist task in browser.");
}

// src/Actions/TodoistActions/AddOrEditCommentAction.ts
async function runAddOrEditComment(todoist, taskId, selectedText) {
  try {
    console.log("Adding or editing comment for Todoist task...");
    const comments = todoist.getComments({ task_id: taskId });
    const options = ["Create New Comment"];
    const commentMap = {};
    comments.forEach((comment, index) => {
      const snippet = comment.content.substring(0, 30).replace(/\r?\n|\r/g, " ");
      const option = `Edit Comment ${index + 1}: ${snippet}...`;
      options.push(option);
      commentMap[option] = comment;
    });
    const actionPrompt = new Prompt;
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
    let commentId = null;
    if (selectedOption !== "Create New Comment") {
      const comment = commentMap[selectedOption];
      commentId = comment.id;
      commentText = comment.content;
    }
    const commentPrompt = new Prompt;
    commentPrompt.title = commentId ? "Edit Comment" : "Add Comment";
    commentPrompt.message = "Enter your comment:";
    commentPrompt.addTextView("comment", "Comment", commentText || selectedText, {
      height: 100
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
      const result2 = todoist.updateComment(commentId, {
        content: commentText
      });
      if (result2 && result2.id) {
        app.displaySuccessMessage("Comment updated on Todoist task.");
        console.log("Comment updated on Todoist task.");
      } else {
        console.error("Failed to update comment on Todoist task:", result2, todoist.lastError);
        app.displayErrorMessage("Failed to update comment on Todoist task.");
        failAction("An unexpected error occurred during execution");
      }
    } else {
      const result2 = todoist.createComment({
        task_id: taskId,
        content: commentText
      });
      if (result2 && result2.id) {
        app.displaySuccessMessage("Comment added to Todoist task.");
        console.log("Comment added to Todoist task.");
      } else {
        console.error("Failed to add comment to Todoist task:", result2, todoist.lastError);
        app.displayErrorMessage("Failed to add comment to Todoist task.");
        failAction("Failed to fetch issue details from Jira.");
      }
    }
  } catch (error) {
    console.error("Error in runAddOrEditComment:", error);
    app.displayErrorMessage("An error occurred while processing comment.");
    failAction("Failed to fetch GitHub item details");
  }
}

// src/Actions/TodoistActions/OpenChatGPTClipboardAction.ts
function runOpenChatGPTClipboard(refinedPrompt) {
  try {
    console.log("openChatGPTWithClipboard: Called with refinedPrompt length =", refinedPrompt.length);
    const existingClipboard = app.getClipboard();
    console.log("openChatGPTWithClipboard: Current clipboard length =", existingClipboard ? existingClipboard.length : 0);
    const messageText = `You have a refined prompt and possibly existing clipboard text.

Refined Prompt length: ${refinedPrompt.length}
Existing Clipboard length: ${existingClipboard ? existingClipboard.length : 0}`;
    const prompt = new Prompt;
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
      console.log("openChatGPTWithClipboard: User canceled the ChatGPT open action.");
      return;
    }
    let finalText = "";
    if (prompt.buttonPressed === "Merge & Copy") {
      console.log("openChatGPTWithClipboard: Merging refinedPrompt with existingClipboard...");
      finalText = refinedPrompt + `

---

` + (existingClipboard || "");
    } else {
      console.log("openChatGPTWithClipboard: Using only refined prompt...");
      finalText = refinedPrompt;
    }
    console.log("openChatGPTWithClipboard: finalText length =", finalText.length);
    app.setClipboard(finalText);
    console.log("openChatGPTWithClipboard: Clipboard updated.");
    let chatGPTUrl = device.systemName === "iOS" ? "googlechrome://chat.openai.com/chat" : "https://chat.openai.com/chat";
    app.openURL(chatGPTUrl);
    console.log("openChatGPTWithClipboard: ChatGPT opened. User can paste final text.");
    app.displaySuccessMessage("Context copied. ChatGPT opened—paste it there as needed.");
  } catch (err) {
    console.error("openChatGPTWithClipboard: Error merging or opening ChatGPT:", err);
    failAction("Error merging or opening ChatGPT", err);
  }
}

// src/Actions/TodoistActions/ComposeChatGPTPromptAction.ts
async function runComposeChatGPTPrompt(todoist, taskId, selectedText) {
  try {
    console.log("composeChatPrompt: Starting method...");
    let task;
    try {
      task = todoist.getTask(taskId);
      console.log("composeChatPrompt: Retrieved task:", JSON.stringify(task));
    } catch (innerErr) {
      console.error("composeChatPrompt: Could not retrieve task details:", innerErr);
    }
    const title = task && task.content ? task.content : "No Title";
    const description = task && task.description ? task.description : "";
    let comments = [];
    let lastComment = "";
    try {
      comments = todoist.getComments({ task_id: taskId }) || [];
      if (comments.length > 0) {
        lastComment = comments[comments.length - 1].content;
      }
    } catch (innerErr2) {
      console.error("composeChatPrompt: Could not retrieve comments:", innerErr2);
    }
    console.log("composeChatPrompt: title =", title);
    console.log("composeChatPrompt: description =", description);
    console.log("composeChatPrompt: lastComment =", lastComment);
    const contextPrompt = new Prompt;
    contextPrompt.title = "Select Task Context Details";
    contextPrompt.message = "Choose which parts of the task context you want to include when building your final ChatGPT content.";
    contextPrompt.addSwitch("includeTitle", "Include Title", true);
    contextPrompt.addSwitch("includeDesc", "Include Description", true);
    contextPrompt.addSwitch("includeLast", "Include Last Comment", true);
    contextPrompt.addSwitch("includeAllComments", "Include ALL Comments", false);
    contextPrompt.addButton("OK", undefined, true);
    contextPrompt.addButton("Cancel");
    const didContextShow = contextPrompt.show();
    if (!didContextShow || contextPrompt.buttonPressed === "Cancel") {
      console.log("User cancelled context selection. Exiting composeChatPrompt.");
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
      optAll
    });
    let userText = selectedText || "";
    console.log("composeChatPrompt: initial userText length =", userText.length);
    while (true) {
      console.log("composeChatPrompt: Displaying prompt for user text...");
      const prompt = new Prompt;
      prompt.title = "Compose ChatGPT Prompt";
      prompt.message = "Refine your text. Task details shown below.";
      prompt.addLabel("titleLabel", `**Task Title**: ${title}`, {
        textSize: "headline"
      });
      if (description.trim().length > 0) {
        prompt.addLabel("descLabel", `**Description**: ${description}`);
      }
      if (lastComment.trim().length > 0) {
        prompt.addLabel("commentLabel", `**Latest Comment**: ${lastComment}`);
      }
      prompt.addTextView("userPrompt", "Your Prompt", userText, {
        height: 120,
        wantsFocus: true
      });
      prompt.addButton("Refine with AI");
      prompt.addButton("Open ChatGPT Now");
      prompt.addButton("OK", undefined, true);
      prompt.addButton("Cancel");
      const didShow = prompt.show();
      console.log("composeChatPrompt: Prompt closed. buttonPressed =", prompt.buttonPressed);
      if (!didShow || prompt.buttonPressed === "Cancel") {
        console.log("User canceled Compose ChatGPT Prompt.");
        return;
      }
      userText = prompt.fieldValues["userPrompt"] || "";
      console.log("composeChatPrompt: Updated userText length =", userText.length);
      if (prompt.buttonPressed === "Refine with AI") {
        console.log("composeChatPrompt: User chose to refine with AI.");
        try {
          const ai = OpenAI.create();
          ai.model = "gpt-4o-mini";
          const refinePrompt = `Please refine the following text:

"${userText}"`;
          const refined = await ai.quickChatResponse(refinePrompt);
          console.log("composeChatPrompt: AI refine response received. length =", (refined || "").length);
          if (refined && refined.trim() !== "") {
            userText = refined.trim();
            console.log("composeChatPrompt: Updated userText after refinement.");
          } else {
            console.warn("No refined text returned by AI.");
            app.displayErrorMessage("No refined text returned.");
          }
        } catch (refineErr) {
          console.error("composeChatPrompt: Error during AI refinement:", refineErr);
          failAction("Error during AI refinement:", refineErr);
        }
      } else if (prompt.buttonPressed === "Open ChatGPT Now") {
        console.log("composeChatPrompt: User chose to open ChatGPT with current refined text.");
        let contextLines = [];
        contextLines.push(`Refined Prompt:
` + userText);
        contextLines.push(`
---

Task Context:
`);
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
              allCommentText += "- " + c.content + `
`;
            }
          } else {
            allCommentText = "(No Comments)";
          }
          contextLines.push(`All Comments:
` + allCommentText.trim());
        } else if (optLast && lastComment.trim().length > 0) {
          contextLines.push("Last Comment: " + lastComment);
        }
        const combinedForClipboard = contextLines.join(`
`);
        runOpenChatGPTClipboard(combinedForClipboard);
      } else if (prompt.buttonPressed === "OK") {
        console.log("composeChatPrompt: User is satisfied with the prompt. Exiting loop.");
        break;
      }
    }
    let finalContextLines = [];
    finalContextLines.push(userText);
    finalContextLines.push(`
---

Task Context:
`);
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
          allCommentText += "- " + c.content + `
`;
        }
      } else {
        allCommentText = "(No Comments)";
      }
      finalContextLines.push(`All Comments:
` + allCommentText.trim());
    } else if (optLast && lastComment.trim().length > 0) {
      finalContextLines.push("Last Comment: " + lastComment);
    }
    const finalContent = finalContextLines.join(`
`);
    console.log("composeChatPrompt: finalContent length =", finalContent.length);
    app.setClipboard(finalContent);
    app.displaySuccessMessage("Final prompt copied to clipboard.");
    console.log("composeChatPrompt: Opening ChatGPT without injection...");
    let chatGPTUrl = device.systemName === "iOS" ? "googlechrome://chat.openai.com/chat" : "https://chat.openai.com/chat";
    app.openURL(chatGPTUrl);
    console.log("ChatGPT opened in browser/scheme. Clipboard has final content.");
  } catch (err) {
    console.error("Error in composeChatPrompt:", err);
    failAction("Error during prompt composition.", err);
  }
}

// src/Actions/TodoistActions/ExportToNewDraftAction.ts
async function runExportToNewDraft(todoist, taskId) {
  try {
    console.log("Exporting Todoist task to new draft...");
    const task = todoist.getTask(taskId);
    const comments = todoist.getComments({ task_id: taskId });
    let content = `# ${task.content}

`;
    if (task.description) {
      content += `${task.description}

`;
    }
    content += `## Task Metadata
`;
    content += `- Original Task ID: ${task.id}
`;
    if (task.createdAt) {
      content += `- Created: ${new Date(task.createdAt).toLocaleString()}
`;
    }
    if (task.due) {
      content += `- Due: ${new Date(task.due.date).toLocaleString()}
`;
    }
    if (task.priority && task.priority !== 1) {
      content += `- Priority: ${task.priority}
`;
    }
    if (comments && comments.length > 0) {
      content += `
## Comments

`;
      content += comments.map((c) => {
        const timestamp = new Date(c.postedAt).toLocaleString();
        return `#### ${timestamp}

${c.content}`;
      }).join(`

---

`);
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

// src/Actions/TodoistActions/ExportAndDeleteAction.ts
async function runExportAndDelete(todoist, taskId) {
  try {
    const exported = await runExportToNewDraft(todoist, taskId);
    if (exported) {
      const deleted = runDeleteTask(todoist, taskId);
      if (deleted) {
        app.displaySuccessMessage("Task exported and deleted successfully.");
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error in exportAndDelete:", error);
    failAction("Failed to export and delete task.", error);
    return false;
  }
}

// src/Actions/TodoistActions/StartSessionForEvanAction.ts
async function runStartSessionForEvan(todoist, taskId) {
  try {
    console.log("Starting session for Evan...");
    const task = todoist.getTask(taskId);
    if (!task) {
      quickAlert("Failed to retrieve task details.", "Task is undefined", true);
      return;
    }
    const duration = 25;
    const comments = todoist.getComments({
      task_id: taskId
    });
    let lastComment = "";
    if (comments && comments.length > 0) {
      lastComment = comments[comments.length - 1].content;
    }
    const title = task.content || "No Title";
    const description = task.description || "No Description";
    const allComments = comments.map((c) => c.content).join(`

---

`) || "No Comments";
    const notes = `${lastComment}

---

${title}

${description}

---

${allComments}`;
    const createThreadPrompt = new Prompt;
    createThreadPrompt.title = "Open ChatGPT?";
    createThreadPrompt.message = "Do you want to open ChatGPT to brainstorm or discuss this task?";
    createThreadPrompt.addButton("Yes");
    createThreadPrompt.addButton("No");
    const threadResult = createThreadPrompt.show();
    if (threadResult && createThreadPrompt.buttonPressed === "Yes") {
      app.setClipboard(notes);
      const chatGPTUrl = device.systemName === "iOS" ? "googlechrome://chat.openai.com/chat" : "https://chat.openai.com/chat";
      app.openURL(chatGPTUrl);
      app.displaySuccessMessage("Context copied. ChatGPT opened—paste it once you're there.");
    }
    const encodedIntent = encodeURIComponent(title);
    const encodedNotes = encodeURIComponent(notes);
    let sessionURL = `session:///start?intent=${encodedIntent}&duration=${duration}&notes=${encodedNotes}`;
    console.log(`Opening Session URL: ${sessionURL}`);
    app.openURL(sessionURL);
    app.displaySuccessMessage("Session started for Evan.");
  } catch (error) {
    console.error("Error in runStartSessionForEvan:", error);
    failAction("Failed to start session.", error);
  }
}

// src/Actions/SourceIntegration/TodoistTask.ts
class TodoistTask extends SourceItem {
  taskId;
  todoist;
  constructor(draft2, selectedText, taskId) {
    super(draft2, selectedText);
    this.taskId = taskId;
    this.todoist = Todoist.create("Todoist");
  }
  async performAction() {
    try {
      console.log("TodoistTask performAction started.");
      const p = new Prompt;
      p.title = "Todoist Task Actions";
      p.message = "What would you like to do?";
      p.addButton("Open in Browser");
      p.addButton("Export All Information");
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
      const result2 = p.show();
      if (!result2 || p.buttonPressed === "Cancel") {
        console.log("User cancelled the action.");
        cancelAction("User cancelled adding comment");
        return;
      }
      console.log("User selected action:", p.buttonPressed, "on TodoistTask performAction.");
      switch (p.buttonPressed) {
        case "Open in Browser":
          runOpenInBrowser(this.taskId);
          break;
        case "Export All Information": {
          runExportAllInformation(this.todoist, this.taskId);
          break;
        }
        case "Add or Edit Comment":
          await runAddOrEditComment(this.todoist, this.taskId, this.selectedText);
          break;
        case "Export to New Draft":
          await runExportToNewDraft(this.todoist, this.taskId);
          break;
        case "Export and Delete":
          {
            const exportDeletePrompt = new Prompt;
            exportDeletePrompt.title = "Confirm Export and Delete";
            exportDeletePrompt.message = "This will export the task to a new draft and then delete it. Continue?";
            exportDeletePrompt.addButton("Yes");
            exportDeletePrompt.addButton("Cancel");
            if (exportDeletePrompt.show() && exportDeletePrompt.buttonPressed === "Yes") {
              await runExportAndDelete(this.todoist, this.taskId);
            }
          }
          break;
        case "Open ChatGPT (Clipboard)":
          {
            const fullContext = runExportAllInformation(this.todoist, this.taskId);
            if (fullContext) {
              runOpenChatGPTClipboard(fullContext);
            }
          }
          break;
        case "Compose ChatGPT Prompt":
          await runComposeChatGPTPrompt(this.todoist, this.taskId, this.selectedText);
          break;
        case "Start Session for Evan":
          await runStartSessionForEvan(this.todoist, this.taskId);
          break;
        case "Delete Task":
        case "Delete Task":
          {
            const deletePrompt = new Prompt;
            deletePrompt.title = "Confirm Delete";
            deletePrompt.message = "Are you sure you want to delete this task? This cannot be undone.";
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

// src/helpers/helpers-get-text.ts
var getDraftLength = () => {
  return draft.content.length;
};
var getSelectedText = () => {
  return editor.getSelectedText();
};
var getSelectedRange = () => {
  return editor.getSelectedRange();
};
var getSelectionStartIndex = () => {
  return getSelectedRange()[0];
};
var getCursorPosition = () => {
  return getSelectionStartIndex();
};
var isLastLine = (text) => {
  return !text.endsWith("\\n");
};
var isEndOfDraft = (positionIndex) => {
  return positionIndex === getDraftLength();
};
var getSelectionEndIndex = (selectionStartIndex, selectionLength) => {
  if (selectionStartIndex === undefined || selectionLength === undefined) {
    [selectionStartIndex, selectionLength] = getSelectedRange();
  }
  const selectionEndIndex = selectionStartIndex + selectionLength;
  if (isEndOfDraft(selectionEndIndex)) {
    return selectionEndIndex;
  }
  const textAfterSelection = getTextAfter(selectionEndIndex);
  if (textAfterSelection.trim() === "") {
    const selectedText = getTextfromRange(selectionStartIndex, selectionLength);
    const trimmedSelectedText = selectedText.trim();
    return selectionStartIndex + trimmedSelectedText.length;
  }
  return selectionEndIndex;
};
var getCurrentLineRange = () => {
  const [currentLineStartIndex, currentLineLength] = editor.getSelectedLineRange();
  const currentLineText = getTextfromRange(currentLineStartIndex, currentLineLength);
  if (isLastLine(currentLineText)) {
    return [currentLineStartIndex, currentLineLength];
  }
  return [currentLineStartIndex, currentLineLength - 1];
};
var getCurrentLineStartIndex = () => {
  return getCurrentLineRange()[0];
};
var getCurrentLineLength = () => {
  return getCurrentLineRange()[1];
};
var getCurrentLineEndIndex = () => {
  return getCurrentLineStartIndex() + getCurrentLineLength();
};
var getSelectionOrCurrentLineRange = () => {
  const selectedText = getSelectedText();
  if (!selectedText) {
    return getCurrentLineRange();
  } else {
    return getSelectedRange();
  }
};
var getSelectionOrCurrentLineStartIndex = () => {
  return getSelectionOrCurrentLineRange()[0];
};
var getSelectionOrCurrentLineLength = () => {
  return getSelectionOrCurrentLineRange()[1];
};
var getTextfromRange = (startIndex, length) => {
  return editor.getTextInRange(startIndex, length);
};
var getTextFromStartEnd = (startIndex, endIndex) => {
  return getTextfromRange(startIndex, endIndex - startIndex);
};
var getCurrentLineText = () => {
  return getTextfromRange(...getCurrentLineRange());
};
var getSelectedTextOrCurrentLine = () => {
  const selectedText = getSelectedText();
  if (!selectedText) {
    return getCurrentLineText();
  } else {
    return selectedText;
  }
};
var getTextBefore = (positionIndex) => {
  return getTextFromStartEnd(0, positionIndex);
};
var getTextAfter = (positionIndex) => {
  const endOfDraft = getDraftLength();
  return getTextFromStartEnd(positionIndex, endOfDraft);
};
var getPreviousOccurrenceIndex = (char, cursorPosition) => {
  const textBeforeCursor = getTextBefore(cursorPosition);
  const previousOccurrenceIndex = textBeforeCursor.lastIndexOf(char);
  return previousOccurrenceIndex === -1 ? 0 : previousOccurrenceIndex;
};
var getNextOccurrenceIndex = (char, cursorPosition) => {
  const nextOccurrenceIndex = draft.content.indexOf(char, cursorPosition + 1);
  return nextOccurrenceIndex === -1 ? getDraftLength() : nextOccurrenceIndex;
};

// src/helpers/helpers-set-text.ts
var setSelectedText = (text) => {
  editor.setSelectedText(text);
};
var setTextinRange = (text, startIndex, length) => {
  editor.setTextInRange(startIndex, length, text);
};
var setSelectionRange = (selectionStartIndex, selectionLength) => {
  editor.setSelectedRange(selectionStartIndex, selectionLength);
};
var setSelectionStartEnd = (selectionStartIndex, selectionEndIndex) => {
  setSelectionRange(selectionStartIndex, selectionEndIndex - selectionStartIndex);
};
var setSelectionRangeKeepNewline = (selectionStartIndex, selectionLength) => {
  const selectedText = getTextfromRange(selectionStartIndex, selectionLength);
  if (isLastLine(selectedText)) {
    setSelectionRange(selectionStartIndex, selectionLength);
  } else {
    setSelectionRange(selectionStartIndex, selectionLength - 1);
  }
};
var setCursorPosition = (newCursorPosition) => {
  setSelectionRange(newCursorPosition, 0);
};
var trimSelectedText = (selectionStartIndex, selectionEndIndex) => {
  const selectedText = getTextFromStartEnd(selectionStartIndex, selectionEndIndex);
  const trimmedText = selectedText.trim();
  const trimmedTextStart = selectionStartIndex + selectedText.indexOf(trimmedText);
  const trimmedTextEnd = trimmedTextStart + trimmedText.length;
  return [trimmedTextStart, trimmedTextEnd];
};
var insertTextAndSetCursor = (text, selectionStartIndex) => {
  setSelectedText(text);
  setCursorPosition(selectionStartIndex + text.length);
};
var transformSelectedText = (transformationFunction) => {
  const selectedText = getSelectedText();
  return transformationFunction(selectedText);
};
var transformAndReplaceSelectedText = (transformationFunction) => {
  const transformedText = transformSelectedText(transformationFunction);
  setSelectedText(transformedText);
};

// src/helpers/helpers-utils.ts
var getClipboard = () => {
  return app.getClipboard();
};
var copyToClipboard = (text) => {
  app.setClipboard(text);
};
var copySelectedTextToClipboard = () => {
  const selectedText = getSelectedText();
  copyToClipboard(selectedText);
};
var isUrl = (s) => {
  const urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return urlRegex.test(s);
};
var getUrlFromClipboard = () => {
  const clipboard = getClipboard();
  return isUrl(clipboard) ? clipboard : "";
};
function log(message, critical = false) {
  console.log(message);
  if (critical) {
    alert(message);
  }
}
function showAlert2(title, message) {
  alert(`${title}

${message}`);
}
function showPromptWithButtons(title, message, buttonLabels) {
  const p = new Prompt;
  p.title = title;
  p.message = message;
  for (const label of buttonLabels) {
    p.addButton(label);
  }
  if (!p.show()) {
    return null;
  }
  if (p.buttonPressed === "Cancel") {
    return null;
  }
  return p.buttonPressed;
}
function getTodoistCredential() {
  const credential = Credential.create("Todoist", "Todoist API access");
  credential.addPasswordField("token", "API Token");
  credential.authorize();
  const todoist = Todoist.create();
  todoist.token = credential.getValue("token");
  return todoist;
}

// src/actions-editing-copycutdelete.ts
class CopyCutDelete {
  lineStartIndex;
  lineLength;
  text;
  cursorPosition;
  constructor() {
    [this.lineStartIndex, this.lineLength] = getCurrentLineRange();
    this.text = getTextfromRange(this.lineStartIndex, this.lineLength);
    this.cursorPosition = getCursorPosition();
  }
  addNewlineIfEndOfDraft = () => {
    return isLastLine(this.text) ? `
` : "";
  };
  copyLineUp = () => {
    setTextinRange(this.text + this.addNewlineIfEndOfDraft(), this.lineStartIndex, 0);
    setCursorPosition(this.cursorPosition);
  };
  copyLineDown = () => {
    const newlineIfEndOfDraft = this.addNewlineIfEndOfDraft();
    setTextinRange(newlineIfEndOfDraft + this.text, this.lineStartIndex + this.lineLength, 0);
    setCursorPosition(this.cursorPosition + this.lineLength + newlineIfEndOfDraft.length);
  };
  copyLineToClipboard = () => {
    const selectedText = getSelectedTextOrCurrentLine();
    copyToClipboard(selectedText);
  };
  cutLine = () => {
    const selectedRange = getSelectionOrCurrentLineRange();
    const selectedText = getTextfromRange(...selectedRange);
    copyToClipboard(selectedText);
    setSelectionRangeKeepNewline(...selectedRange);
    setSelectedText("");
  };
  deleteLine = () => {
    setTextinRange("", this.lineStartIndex, this.lineLength);
    let remainingText = getTextfromRange(this.lineStartIndex + this.lineLength - 2, getDraftLength()).trim();
    if (remainingText) {
      setCursorPosition(this.lineStartIndex);
    } else {
      setCursorPosition(this.lineStartIndex - 1);
      const previousLineStartIndex = getCurrentLineStartIndex();
      setCursorPosition(previousLineStartIndex);
    }
  };
}
var copyLineUp = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.copyLineUp();
};
var copyLineDown = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.copyLineDown();
};
var copyLineToClipboard = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.copyLineToClipboard();
};
var cutLine = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.cutLine();
};
var deleteLine = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.deleteLine();
};
// src/actions-editing-selection.ts
var selectSection = (sectionSeparator) => {
  const cursorPosition = getCursorPosition();
  const previousSeparatorPosition = getPreviousOccurrenceIndex(sectionSeparator, cursorPosition);
  const nextSeparatorPosition = getNextOccurrenceIndex(sectionSeparator, cursorPosition);
  const sectionStart = previousSeparatorPosition === 0 ? previousSeparatorPosition : previousSeparatorPosition + sectionSeparator.length;
  const sectionEnd = nextSeparatorPosition;
  const [trimmedSectionStart, trimmedSectionEnd] = trimSelectedText(sectionStart, sectionEnd);
  setSelectionRange(trimmedSectionStart, trimmedSectionEnd - trimmedSectionStart);
};
var selectLine = () => {
  selectSection(`
`);
};
var selectParagraph = () => {
  selectSection(`

`);
};
var selectResponse = () => {
  selectSection("---");
  copySelectedTextToClipboard();
};
var selectAll = () => {
  const endOfDraft = getDraftLength();
  setSelectionRange(0, endOfDraft);
};
// src/actions-editing-utils.ts
var insertDictation = () => {
  const [selectionStartIndex, selectionLength] = getSelectedRange();
  const dictatedText = editor.dictate();
  if (dictatedText) {
    setTextinRange(dictatedText, selectionStartIndex, selectionLength);
    setCursorPosition(selectionStartIndex + dictatedText.length);
    editor.activate();
  }
};
var pasteClipboard = () => {
  const clipboard = getClipboard();
  const selectionStartIndex = getSelectionStartIndex();
  insertTextAndSetCursor(clipboard, selectionStartIndex);
};
// src/actions-navigation.ts
var moveCursorLeft = () => {
  const selectionStartIndex = getSelectionStartIndex();
  if (selectionStartIndex > 0) {
    setSelectionRange(selectionStartIndex - 1, 0);
  }
};
var moveCursorRight = () => {
  const selectionStartIndex = getSelectionStartIndex();
  setSelectionRange(selectionStartIndex + 1, 0);
};
var jumpToPreviousHeader = () => {
  const cursorPosition = getCursorPosition();
  const previousHeaderPosition = getPreviousOccurrenceIndex(`
#`, cursorPosition) + 1;
  if (previousHeaderPosition === 1) {
    setCursorPosition(0);
  } else {
    setCursorPosition(previousHeaderPosition);
  }
};
var jumpToNextHeader = () => {
  const cursorPosition = getCursorPosition();
  const nextHeaderPosition = getNextOccurrenceIndex(`
#`, cursorPosition) + 1;
  setCursorPosition(nextHeaderPosition);
};
// src/actions-markdown-highlighting.ts
class SyntaxHighlighter {
  selectionStartIndex;
  selectionLength;
  selectionEndIndex;
  selectedText;
  constructor() {
    [this.selectionStartIndex, this.selectionLength] = getSelectedRange();
    this.selectionEndIndex = getSelectionEndIndex(this.selectionStartIndex, this.selectionLength);
    this.selectedText = getSelectedText();
  }
  textIsSelected = () => {
    return this.selectionLength > 0;
  };
  innerTextIsHighlighted = (highlightPrefix, highlightSuffix) => {
    const textBeforeSelection = getTextBefore(this.selectionStartIndex);
    const textAfterSelection = getTextAfter(this.selectionEndIndex);
    return textBeforeSelection.endsWith(highlightPrefix) && textAfterSelection.startsWith(highlightSuffix);
  };
  outerTextIsHighlighted = (highlightPrefix, highlightSuffix) => {
    return this.selectedText.startsWith(highlightPrefix) && this.selectedText.endsWith(highlightSuffix);
  };
  textIsHighlightedAsymmetric = (highlightPrefix, highlightSuffix) => {
    return this.innerTextIsHighlighted(highlightPrefix, highlightSuffix) || this.outerTextIsHighlighted(highlightPrefix, highlightSuffix);
  };
  textIsHighlightedSymmetric = (highlightChar) => {
    return this.textIsHighlightedAsymmetric(highlightChar, highlightChar);
  };
  addHighlightAsymmetric = (highlightPrefix, highlightSuffix) => {
    setSelectedText(highlightPrefix + this.selectedText + highlightSuffix);
    setCursorPosition(this.selectionEndIndex + highlightPrefix.length + highlightSuffix.length);
  };
  addHighlightSymmetric = (highlightChar) => {
    this.addHighlightAsymmetric(highlightChar, highlightChar);
  };
  removeHighlightAsymmetric = (highlightPrefix, highlightSuffix) => {
    if (this.outerTextIsHighlighted(highlightPrefix, highlightSuffix)) {
      setSelectedText(this.selectedText.slice(highlightPrefix.length, -highlightSuffix.length));
      return;
    }
    setSelectionStartEnd(this.selectionStartIndex - highlightPrefix.length, this.selectionEndIndex + highlightSuffix.length);
    setSelectedText(this.selectedText);
  };
  removeHighlightSymmetric = (highlightChar) => {
    this.removeHighlightAsymmetric(highlightChar, highlightChar);
  };
  insertOpeningOrClosingCharacter = (highlightChar) => {
    setSelectedText(highlightChar);
    setCursorPosition(this.selectionStartIndex + highlightChar.length);
  };
  addOrRemoveHighlightSymmetric = (highlightChar) => {
    if (!this.textIsSelected()) {
      this.insertOpeningOrClosingCharacter(highlightChar);
      return;
    }
    if (this.textIsHighlightedSymmetric(highlightChar)) {
      this.removeHighlightSymmetric(highlightChar);
      return;
    }
    this.addHighlightSymmetric(highlightChar);
  };
  addOrRemoveHighlightAsymmetric = (highlightPrefix, highlightSuffix) => {
    if (!this.textIsSelected()) {
      const textBeforeCursor = getTextBefore(this.selectionStartIndex);
      const lastPrefixIndex = textBeforeCursor.lastIndexOf(highlightPrefix);
      const lastSuffixIndex = textBeforeCursor.lastIndexOf(highlightSuffix);
      if (lastPrefixIndex > lastSuffixIndex) {
        this.insertOpeningOrClosingCharacter(highlightSuffix);
      } else {
        this.insertOpeningOrClosingCharacter(highlightPrefix);
      }
      return;
    }
    if (this.textIsHighlightedAsymmetric(highlightPrefix, highlightSuffix)) {
      this.removeHighlightAsymmetric(highlightPrefix, highlightSuffix);
      return;
    }
    this.addHighlightAsymmetric(highlightPrefix, highlightSuffix);
  };
}
var highlightBold = () => {
  const syntaxHighlighter = new SyntaxHighlighter;
  syntaxHighlighter.addOrRemoveHighlightSymmetric("**");
};
var highlightItalic = () => {
  const syntaxHighlighter = new SyntaxHighlighter;
  syntaxHighlighter.addOrRemoveHighlightSymmetric("*");
};
var highlightCode = () => {
  const syntaxHighlighter = new SyntaxHighlighter;
  syntaxHighlighter.addOrRemoveHighlightSymmetric("`");
};
var highlightCodeBlock = () => {
  const syntaxHighlighter = new SyntaxHighlighter;
  syntaxHighlighter.addOrRemoveHighlightAsymmetric("```\n", "\n```");
};
// src/actions-markdown-links.ts
class MarkdownLink {
  selectedText;
  selectionStartIndex;
  selectionLength;
  url;
  prefix;
  constructor(selectedText, selectionStartIndex, selectionLength, url, prefix) {
    this.selectedText = selectedText;
    this.selectionStartIndex = selectionStartIndex;
    this.selectionLength = selectionLength;
    this.url = url;
    this.prefix = prefix;
  }
  insertEmptyLink() {
    setSelectedText(`${this.prefix}[]()`);
    setCursorPosition(this.selectionStartIndex + 1);
  }
  insertTextLink() {
    setSelectedText(`${this.prefix}[${this.selectedText}]()`);
    setCursorPosition(this.selectionStartIndex + this.selectionLength + 3);
  }
  insertUrlLink() {
    setSelectedText(`${this.prefix}[](${this.url})`);
    setCursorPosition(this.selectionStartIndex + 1);
  }
  insertFullLink() {
    setSelectedText(`${this.prefix}[${this.selectedText}](${this.url})`);
    setCursorPosition(this.selectionStartIndex + this.selectionLength + this.url.length + 4);
  }
}
var insertMarkdownLinkWithPrefix = (prefix) => {
  const url = getUrlFromClipboard();
  const selectedText = getSelectedText();
  const [selectionStartIndex, selectionLength] = getSelectedRange();
  const markdownLink = new MarkdownLink(selectedText, selectionStartIndex, selectionLength, url, prefix);
  if (url.length == 0 && selectionLength == 0) {
    markdownLink.insertEmptyLink();
    return;
  }
  if (url.length == 0) {
    markdownLink.insertTextLink();
    return;
  }
  if (selectionLength == 0) {
    markdownLink.insertUrlLink();
    return;
  }
  markdownLink.insertFullLink();
};
var insertMarkdownLink = () => {
  insertMarkdownLinkWithPrefix("");
};
var insertMarkdownImage = () => {
  insertMarkdownLinkWithPrefix("!");
};
// src/actions-markdown-lists.ts
var getIndentation = (lineText) => {
  const indentationRegex = /^(\s*)/;
  const indentationMatch = lineText.match(indentationRegex);
  if (!indentationMatch) {
    return "";
  }
  return indentationMatch[1];
};
var checkIfLineIsListItem = (lineText) => {
  const listItemRegex = /^(\s*)([-*+]|\d+\.)\s/;
  const listItemMatch = lineText.match(listItemRegex);
  if (!listItemMatch) {
    return false;
  }
  return true;
};
var linebreakKeepIndentation = () => {
  const currentLineStartIndex = getCurrentLineStartIndex();
  const currentLineEndIndex = getCurrentLineEndIndex();
  const currentLineText = getTextFromStartEnd(currentLineStartIndex, currentLineEndIndex);
  let indentation = getIndentation(currentLineText);
  const isListItem = checkIfLineIsListItem(currentLineText);
  if (isListItem) {
    indentation += "  ";
  }
  const newLineText = `
${indentation}`;
  insertTextAndSetCursor(newLineText, currentLineEndIndex);
};
// src/actions-markdown-tasks.ts
class ToggleMarkdown {
  taskState;
  taskPatterns;
  CheckboxPatterns;
  constructor() {
    this.taskState = {
      uncheckedBox: "[ ]",
      checkedBox: "[x]",
      uncheckedTask: "- [ ]",
      checkedTask: "- [x]"
    };
    this.taskPatterns = [
      this.taskState.uncheckedTask,
      this.taskState.checkedTask
    ];
    this.CheckboxPatterns = Object.values(this.taskState);
  }
  lineHasPattern(line, patterns) {
    const trimmedLine = line.trim();
    return patterns.some((pattern) => trimmedLine.startsWith(pattern));
  }
  selectionHasItem(selectedLines, checkFunction) {
    return selectedLines.some((line) => checkFunction(line));
  }
  toggleMarkdown = (toggleFunction) => {
    const selectionStartIndex = getSelectionOrCurrentLineStartIndex();
    const selectionLength = getSelectionOrCurrentLineLength();
    const selection = getTextfromRange(selectionStartIndex, selectionLength);
    const toggledSelection = toggleFunction(selection);
    setSelectionRange(selectionStartIndex, selectionLength);
    setSelectedText(toggledSelection);
    const toggledSelectionEndIndex = getSelectionEndIndex(selectionStartIndex, toggledSelection.length);
    setCursorPosition(toggledSelectionEndIndex);
  };
  lineHasTask(line) {
    return this.lineHasPattern(line, this.taskPatterns);
  }
  removeTaskMarkerIfRequired(line) {
    for (let taskPattern of this.taskPatterns) {
      line = line.replace(taskPattern, "").trim();
    }
    return line;
  }
  addTaskMarkerIfRequired(line) {
    if (this.lineHasTask(line) || line.trim() === "") {
      return line;
    }
    if (line.trim().startsWith("-")) {
      return `${this.taskState.uncheckedTask} ${line.replace("-", "")}`;
    }
    return `${this.taskState.uncheckedTask} ${line}`;
  }
  selectionHasTask(selectedLines) {
    return this.selectionHasItem(selectedLines, (line) => this.lineHasTask(line));
  }
  toggleTasksSelection = (selection) => {
    const selectedLines = selection.split(`
`);
    if (this.selectionHasTask(selectedLines)) {
      return selectedLines.map((line) => this.removeTaskMarkerIfRequired(line)).join(`
`);
    }
    return selectedLines.map((line) => this.addTaskMarkerIfRequired(line)).join(`
`);
  };
  toggleMarkdownTasks = () => {
    this.toggleMarkdown(this.toggleTasksSelection);
  };
  lineHasCheckbox(line) {
    return this.lineHasPattern(line, this.CheckboxPatterns);
  }
  lineIsChecked(line) {
    return line.includes(this.taskState.checkedBox);
  }
  checkBox(line) {
    if (!this.lineHasCheckbox(line)) {
      return line;
    }
    return line.replace(this.taskState.uncheckedBox, this.taskState.checkedBox);
  }
  uncheckBox(line) {
    if (!this.lineHasCheckbox(line)) {
      return line;
    }
    return line.replace(this.taskState.checkedBox, this.taskState.uncheckedBox);
  }
  selectionIsChecked(selectedLines) {
    return this.selectionHasItem(selectedLines, (line) => this.lineHasCheckbox(line) && this.lineIsChecked(line));
  }
  toggleCheckboxesSelection = (selection) => {
    const selectedLines = selection.split(`
`);
    if (this.selectionIsChecked(selectedLines)) {
      return selectedLines.map((line) => this.uncheckBox(line)).join(`
`);
    }
    return selectedLines.map((line) => this.checkBox(line)).join(`
`);
  };
  toggleMarkdownCheckboxes = () => {
    this.toggleMarkdown(this.toggleCheckboxesSelection);
  };
}
var toggleMarkdownTasks = () => {
  const toggleMarkdown = new ToggleMarkdown;
  toggleMarkdown.toggleMarkdownTasks();
};
var toggleMarkdownCheckboxes = () => {
  const toggleMarkdown = new ToggleMarkdown;
  toggleMarkdown.toggleMarkdownCheckboxes();
};
// src/actions-transform-case.ts
var removeExtraWhitespace = (s) => {
  return s.trim().replace(/\s+/g, " ");
};
var removeWhitespace = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).replace(/\s/g, "");
  });
};
var trimWhitespace = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).trim();
  });
};
var toLowerCaseCustom = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).toLowerCase();
  });
};
var toUpperCaseCustom = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).toUpperCase();
  });
};
var _toTitleCaseWord = (str) => {
  if (!str) {
    return "";
  }
  const firstLetter = str[0];
  return str.length == 1 ? firstLetter : firstLetter.toUpperCase() + str.slice(1);
};
var _toTitleCase = (str) => {
  return removeExtraWhitespace(str).split(" ").map(_toTitleCaseWord).join(" ");
};
var toTitleCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return _toTitleCase(selectedText);
  });
};
var capitalize = () => {
  transformAndReplaceSelectedText((selectedText) => {
    const noExtraWhitespace = removeExtraWhitespace(selectedText);
    return noExtraWhitespace[0].toUpperCase() + noExtraWhitespace.slice(1).toLowerCase();
  });
};
var _toMemeCaseWord = (str) => {
  let transformed_chars = [];
  for (let [i, char] of str.split("").entries()) {
    if (i % 2 == 0) {
      transformed_chars.push(char.toLowerCase());
    } else {
      transformed_chars.push(char.toUpperCase());
    }
  }
  return transformed_chars.join("");
};
var toMemeCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).split(" ").map(_toMemeCaseWord).join(" ");
  });
};
var replaceWhitespace = (str, replacement) => {
  return removeExtraWhitespace(str).replace(/\s/g, replacement);
};
var toSnakeCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return replaceWhitespace(selectedText, "_");
  });
};
var toHyphenCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return replaceWhitespace(selectedText, "-");
  });
};
var toPascalCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    const noExtraWhitespace = removeExtraWhitespace(selectedText);
    const titleCase = _toTitleCase(noExtraWhitespace);
    return titleCase.replace(/\s/g, "");
  });
};
var toCamelCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    const noExtraWhitespace = removeExtraWhitespace(selectedText);
    const titleCase = _toTitleCase(noExtraWhitespace);
    return titleCase[0].toLowerCase() + titleCase.slice(1).replace(/\s/g, "");
  });
};
var sortLines = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return selectedText.split(`
`).sort((a, b) => a.localeCompare(b)).join(`
`);
  });
};
// src/actions-transform-math.ts
class MathEvaluator {
  trimmedText;
  separator;
  numbers;
  constructor() {
    this.trimmedText = removeExtraWhitespace(getSelectedText()).trim();
    this.separator = this.findSeparator();
    this.numbers = this.splitBySeparator();
  }
  evaluate() {
    const sanitizedExpression = this.trimmedText.replace(/[^0-9+\-*/(). ]/g, "");
    const result = eval(sanitizedExpression);
    return String(result);
  }
  findSeparator() {
    const separators = [",", ";"];
    for (const separator of separators) {
      if (this.trimmedText.includes(separator)) {
        return separator;
      }
    }
    return " ";
  }
  splitBySeparator() {
    const separator = this.findSeparator();
    return this.trimmedText.split(separator).map((n) => Number(n));
  }
  sumToInt() {
    return this.numbers.reduce((a, b) => a + b, 0);
  }
  sum() {
    return this.sumToInt().toString();
  }
  product() {
    return this.numbers.reduce((a, b) => a * b, 1).toString();
  }
  max() {
    return Math.max(...this.numbers).toString();
  }
  min() {
    return Math.min(...this.numbers).toString();
  }
  mean() {
    return (this.sumToInt() / this.numbers.length).toString();
  }
}
var evaluateMathExpression = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.evaluate();
  });
};
var sum = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.sum();
  });
};
var product = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.product();
  });
};
var max = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.max();
  });
};
var min = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.min();
  });
};
var mean = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.mean();
  });
};
// src/actions-shortcuts.ts
var copyAllTagsToClipboard = () => {
  const uniqueTagsArray = Tag.query("");
  const sortedTags = uniqueTagsArray.sort().join(`
`);
  copyToClipboard(sortedTags);
};
// src/Actions/TaskActions/TaskMenus.ts
async function handleOverdueTasks(todoist) {
  log("Fetching overdue tasks...");
  const overdueTasks = await todoist.getTasks({ filter: "overdue" });
  log(`Fetched ${overdueTasks.length} overdue tasks.`);
  return overdueTasks;
}
async function handleDeadlineTasks(todoist) {
  log("Fetching tasks with deadlines for today or tomorrow...");
  let response = await todoist.request({
    url: "https://api.todoist.com/rest/v2/tasks",
    method: "GET"
  });
  if (!response.success) {
    log(`Failed to fetch tasks - Status code: ${response.statusCode}`, true);
    log(`Error: ${response.error}`);
    return [];
  }
  let allTasks = response.responseData;
  let today = new Date;
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let todayStr = today.toISOString().split("T")[0];
  let tomorrowStr = tomorrow.toISOString().split("T")[0];
  let deadlineTasks = allTasks.filter((task) => task.deadline && (task.deadline.date === todayStr || task.deadline.date === tomorrowStr));
  log(`Found ${deadlineTasks.length} tasks with deadlines for today or tomorrow`);
  return deadlineTasks;
}
async function handleNoTimeTasks(todoist) {
  log("Fetching tasks due today with no time set...");
  let allTodayTasks = await todoist.getTasks({ filter: "due: today" });
  let noTimeTasks = allTodayTasks.filter((t) => !t.due?.datetime);
  log(`Found ${noTimeTasks.length} tasks due today with no time.`);
  return noTimeTasks;
}
async function handleNoDurationTasks(todoist) {
  log("Fetching tasks due today with no duration...");
  let allTodayTasks = await todoist.getTasks({ filter: "due: today" });
  let noDurationTasks = allTodayTasks.filter((t) => !t.duration);
  log(`Found ${noDurationTasks.length} tasks due today with no duration.`);
  return noDurationTasks;
}
async function updateToToday(todoist, task) {
  let updateOptions = { content: task.content };
  const chosenTime = pickTimeForToday();
  if (!chosenTime)
    return;
  updateOptions.due_string = chosenTime;
  await todoist.updateTask(task.id, updateOptions);
}
async function moveToFuture(todoist, task) {
  const { pickFutureDate: pickFutureDate2 } = await Promise.resolve().then(() => exports_DateTimePrompts);
  let updateOptions = { content: task.content };
  const dateChoice = pickFutureDate2();
  if (!dateChoice)
    return;
  Object.assign(updateOptions, dateChoice);
  await todoist.updateTask(task.id, updateOptions);
}
async function assignDurationToTask(todoist, task) {
  log(`Assigning duration to task: "${task.content}"`);
  if (!task.due?.datetime) {
    log(`Task does not have a due time. Setting the due time to 1 hour from now so we can add a duration.`);
    const oneHourFromNow = new Date;
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    const isoTime = oneHourFromNow.toISOString();
    const timeUpdate = {
      content: task.content,
      due_datetime: isoTime
    };
    let setDueTimeSuccess = await todoist.updateTask(task.id, timeUpdate);
    if (!setDueTimeSuccess) {
      log(`Failed to set due time for ${task.content}. Aborting.`, true);
      return false;
    }
  }
  let durationPrompt = new Prompt;
  durationPrompt.title = "Assign Duration";
  durationPrompt.message = `Assign a duration for:
"${task.content}"`;
  const durations = ["15 minutes", "30 minutes", "1 hour", "2 hours", "Custom"];
  durations.forEach((d) => durationPrompt.addButton(d));
  durationPrompt.addButton("Skip");
  if (!durationPrompt.show()) {
    log(`User skipped assigning duration for "${task.content}"`);
    return false;
  }
  const userButton = durationPrompt.buttonPressed;
  if (userButton === "Skip") {
    log(`User pressed skip for "${task.content}". Setting default 60 minute duration...`);
    let skipDuration = 60;
    let skipUpdate = {
      content: task.content,
      duration: skipDuration,
      duration_unit: "minute"
    };
    let skipSuccess = await todoist.updateTask(task.id, skipUpdate);
    if (skipSuccess) {
      log(`Defaulted duration: ${skipDuration} minutes to "${task.content}" since user skipped setting a custom duration.`);
      return true;
    } else {
      log(`Failed to default duration for "${task.content}" - ${todoist.lastError}`, true);
      return false;
    }
  } else if (durations.includes(userButton)) {
    log(`User selected duration: ${userButton}`);
    if (userButton !== "Custom") {
      let [amount, unitText] = userButton.split(" ");
      let durationAmount = parseInt(amount);
      if (unitText.startsWith("hour")) {
        durationAmount = durationAmount * 60;
      }
      let durationUpdate = {
        content: task.content,
        duration: durationAmount,
        duration_unit: "minute"
      };
      let durationSuccess = await todoist.updateTask(task.id, durationUpdate);
      if (durationSuccess) {
        log(`Assigned duration: ${durationAmount} minutes to "${task.content}"`);
        return true;
      } else {
        log(`Failed to assign duration to "${task.content}" - ${todoist.lastError}`, true);
        return false;
      }
    } else {
      let customDurationPrompt = new Prompt;
      customDurationPrompt.title = "Custom Duration";
      customDurationPrompt.message = `Enter a custom duration for:
"${task.content}"`;
      customDurationPrompt.addTextField("customDuration", "Duration (e.g., 45 minutes)", "");
      customDurationPrompt.addButton("Save");
      customDurationPrompt.addButton("Cancel");
      if (customDurationPrompt.show()) {
        if (customDurationPrompt.buttonPressed === "Save") {
          let customDurationInput = customDurationPrompt.fieldValues["customDuration"];
          log(`User entered custom duration: ${customDurationInput}`);
          let customMatch = customDurationInput.match(/(\d+)\s*(minute|minutes|hour|hours|day|days)/i);
          if (customMatch) {
            let amount = parseInt(customMatch[1]);
            let unitInput = customMatch[2].toLowerCase();
            if (unitInput.startsWith("hour")) {
              amount = amount * 60;
            }
            let customDurationUpdate = {
              content: task.content,
              duration: amount,
              duration_unit: "minute"
            };
            let customDurationSuccess = await todoist.updateTask(task.id, customDurationUpdate);
            if (customDurationSuccess) {
              log(`Assigned custom duration: ${amount} minutes to "${task.content}"`);
              return true;
            } else {
              log(`Failed to assign custom duration to "${task.content}" - ${todoist.lastError}`, true);
              return false;
            }
          } else {
            log(`Invalid custom duration format: "${customDurationInput}"`, true);
            showAlert2("Invalid Duration", "Please enter the duration like '45 minutes' or '2 hours'.");
            return false;
          }
        }
      }
    }
  }
  return false;
}

// src/Actions/TaskActions/TodoistEnhancedMenu.ts
async function runTodoistEnhancedMenu() {
  const todoist = getTodoistCredential();
  let mainPrompt = new Prompt;
  mainPrompt.title = "Manage Tasks";
  mainPrompt.message = "Select which category you want to fetch tasks for:";
  mainPrompt.addButton("Tasks Due Today (No Time)");
  mainPrompt.addButton("Tasks Due Today (No Duration)");
  mainPrompt.addButton("Overdue Tasks");
  mainPrompt.addButton("Deadline Tasks (Today/Tomorrow)");
  mainPrompt.addButton("Cancel");
  if (!mainPrompt.show() || mainPrompt.buttonPressed === "Cancel") {
    log("User cancelled the main prompt.");
    script.complete();
    return;
  }
  let tasksToStore = [];
  switch (mainPrompt.buttonPressed) {
    case "Tasks Due Today (No Time)":
      draft.setTemplateTag("TasksFilterUsed", "NoTime");
      tasksToStore = await handleNoTimeTasks(todoist);
      break;
    case "Tasks Due Today (No Duration)":
      draft.setTemplateTag("TasksFilterUsed", "NoDuration");
      tasksToStore = await handleNoDurationTasks(todoist);
      break;
    case "Overdue Tasks":
      draft.setTemplateTag("TasksFilterUsed", "Overdue");
      tasksToStore = await handleOverdueTasks(todoist);
      break;
    case "Deadline Tasks (Today/Tomorrow)":
      draft.setTemplateTag("TasksFilterUsed", "Deadline");
      tasksToStore = await handleDeadlineTasks(todoist);
      break;
  }
  draft.setTemplateTag("TasksForSelection", JSON.stringify(tasksToStore));
  showAlert("Tasks Fetched", "Tasks have been stored in the 'TasksForSelection' template tag. You may now run selectTasksStep to pick which tasks to act on.");
  script.complete();
}
// src/Actions/TaskActions/TodoistFlexibleFlow.ts
async function selectTasksStep() {
  log("selectTasksStep() started. Reading tasks from 'TasksForSelection' template tag.");
  try {
    const tasksData = draft.getTemplateTag("TasksForSelection") || "";
    if (!tasksData) {
      alert("No tasks found in 'TasksForSelection'. Did you run the previous step?");
      script.complete();
      return;
    }
    const tasks = JSON.parse(tasksData);
    log(`Found ${tasks.length} tasks from template tag to select from.`);
    if (tasks.length === 0) {
      alert("No tasks to select from.");
      script.complete();
      return;
    }
    const taskTitles = tasks.map((t) => t.content);
    const prompt = new Prompt;
    prompt.title = "Select Tasks";
    prompt.message = "Select one or more tasks to act on.";
    prompt.addSelect("selectedTasks", "Tasks", taskTitles, [], true);
    prompt.addButton("OK");
    prompt.addButton("Cancel");
    const userDidSelect = prompt.show();
    if (!userDidSelect || prompt.buttonPressed !== "OK") {
      log("User canceled or dismissed the task selection prompt.");
      script.complete();
      return;
    }
    const selectedContents = prompt.fieldValues["selectedTasks"] || [];
    if (!Array.isArray(selectedContents) || selectedContents.length === 0) {
      alert("No tasks selected.");
      script.complete();
      return;
    }
    const selectedTasks = tasks.filter((t) => selectedContents.includes(t.content));
    const filterUsed = draft.getTemplateTag("TasksFilterUsed") || "";
    const relevantActions = getActionsForFilter(filterUsed);
    const actionPrompt = new Prompt;
    actionPrompt.title = "Select Action";
    actionPrompt.message = "Choose an action for the selected tasks:";
    for (const action of relevantActions) {
      actionPrompt.addButton(action);
    }
    actionPrompt.addButton("Cancel");
    const actionDidShow = actionPrompt.show();
    if (!actionDidShow || actionPrompt.buttonPressed === "Cancel") {
      log("User canceled or dismissed the action selection prompt.");
      script.complete();
      return;
    }
    const chosenAction = actionPrompt.buttonPressed;
    log(`User selected action: "${chosenAction}"`);
    draft.setTemplateTag("SelectedTasksData", JSON.stringify(selectedTasks));
    draft.setTemplateTag("SelectedTasksAction", chosenAction);
    alert("Tasks and action have been saved. Run the next step to execute them.");
    log("selectTasksStep() completed. Template tags saved.");
    script.complete();
  } catch (error) {
    log(`Error in selectTasksStep: ${error}`, true);
    script.complete();
  }
}
async function executeSelectedTasksStep() {
  log("executeSelectedTasksStep() invoked.");
  const todoist = getTodoistCredential();
  try {
    const selectedTasksData = draft.getTemplateTag("SelectedTasksData") || "";
    const selectedAction = draft.getTemplateTag("SelectedTasksAction") || "";
    if (!selectedTasksData || !selectedAction) {
      alert("No stored tasks or action found. Did you run the selection step?");
      log("No tasks or action in template tags. Exiting.");
      script.complete();
      return;
    }
    const tasksToProcess = JSON.parse(selectedTasksData);
    log(`Retrieved ${tasksToProcess.length} tasks to process with action "${selectedAction}"`);
    if (tasksToProcess.length === 0) {
      alert("No tasks found in selection data.");
      script.complete();
      return;
    }
    switch (selectedAction) {
      case "Reschedule to Today": {
        for (const task of tasksToProcess) {
          await updateToToday(todoist, task);
        }
        break;
      }
      case "Reschedule to Tomorrow": {
        for (const task of tasksToProcess) {
          await todoist.updateTask(task.id, {
            content: task.content,
            due_string: "tomorrow"
          });
        }
        break;
      }
      case "Reschedule to Future": {
        for (const task of tasksToProcess) {
          await moveToFuture(todoist, task);
        }
        break;
      }
      case "Complete Tasks":
        await completeTasks(todoist, tasksToProcess);
        break;
      case "Remove Due Date":
        await removeTasksDueDate(todoist, tasksToProcess);
        break;
      case "Add Priority Flag":
        await setPriorityFlag(todoist, tasksToProcess);
        break;
      case "Assign Duration": {
        for (const task of tasksToProcess) {
          await assignDurationToTask(todoist, task);
        }
        break;
      }
      default:
        alert(`Unknown action: ${selectedAction}`);
        log(`Unknown action selected: "${selectedAction}"`, true);
        script.complete();
        return;
    }
    alert("Execution step completed successfully!");
    script.complete();
  } catch (error) {
    log(`Error in executeSelectedTasksStep: ${error}`, true);
    script.complete();
  }
}
async function completeTasks(todoist, tasks) {
  for (const task of tasks) {
    try {
      log(`Completing task "${task.content}" (id: ${task.id}).`);
      const closeSuccess = await todoist.closeTask(task.id);
      if (!closeSuccess) {
        log(`Failed to complete task id: ${task.id} - ${todoist.lastError}`, true);
      }
    } catch (err) {
      log(`Error completing task id: ${task.id} - ${String(err)}`, true);
    }
  }
}
async function removeTasksDueDate(todoist, tasks) {
  for (const task of tasks) {
    try {
      log(`Removing due date for task "${task.content}" (id: ${task.id}).`);
      const updateSuccess = await todoist.updateTask(task.id, {
        content: task.content,
        due_string: "no date"
      });
      if (!updateSuccess) {
        log(`Failed to remove due date from task id: ${task.id} - ${todoist.lastError}`, true);
      }
    } catch (err) {
      log(`Error removing due date for task id: ${task.id} - ${String(err)}`, true);
    }
  }
}
async function setPriorityFlag(todoist, tasks) {
  for (const task of tasks) {
    try {
      log(`Setting priority flag for task "${task.content}" (id: ${task.id}).`);
      const updateSuccess = await todoist.updateTask(task.id, {
        content: task.content,
        priority: 4
      });
      if (!updateSuccess) {
        log(`Failed to set priority flag for task id: ${task.id} - ${todoist.lastError}`, true);
      }
    } catch (err) {
      log(`Error setting priority flag for task id: ${task.id} - ${String(err)}`, true);
    }
  }
}
function getActionsForFilter(filterName) {
  switch (filterName) {
    case "NoTime":
      return ["Reschedule to Today", "Reschedule to Future", "Assign Duration"];
    case "NoDuration":
      return ["Assign Duration", "Remove Due Date"];
    case "Overdue":
      return ["Reschedule to Today", "Reschedule to Future", "Complete Tasks"];
    case "Deadline":
      return ["Reschedule to Tomorrow", "Remove Due Date", "Add Priority Flag"];
    default:
      return [
        "Reschedule to Today",
        "Reschedule to Tomorrow",
        "Reschedule to Future",
        "Complete Tasks",
        "Remove Due Date",
        "Add Priority Flag",
        "Assign Duration"
      ];
  }
}
// src/Actions/BatchProcessAction.ts
function runBatchProcessAction() {
  if (draft.hasTag("status::batch-processed")) {
    log("[BatchProcessAction] Draft has 'status::batch-processed'; skipping re-processing.");
    return;
  }
  log("[BatchProcessAction] Starting runBatchProcessAction...");
  let ephemeralJsonRaw = draft.content.trim();
  let ephemeralJson = {};
  let ephemeralHasDraftAction = false;
  try {
    let maybeParsed = JSON.parse(ephemeralJsonRaw);
    if (maybeParsed && maybeParsed.draftAction) {
      ephemeralJson = maybeParsed;
      ephemeralHasDraftAction = true;
      log("[BatchProcessAction] Detected ephemeral JSON with draftAction: " + ephemeralJson.draftAction);
    }
  } catch (err) {
    log("[BatchProcessAction] No ephemeral JSON found in draft.content or it didn't parse.");
  }
  let fallbackJsonRaw = "";
  if (!ephemeralHasDraftAction) {
    fallbackJsonRaw = draft.getTemplateTag("ExecutorData") || "";
    if (fallbackJsonRaw) {
      log("[BatchProcessAction] Found fallback JSON from ExecutorData tag.");
      try {
        let fallbackParsed = JSON.parse(fallbackJsonRaw);
        ephemeralJson = fallbackParsed;
        ephemeralHasDraftAction = !!fallbackParsed.draftAction;
      } catch (err) {
        log("[BatchProcessAction] Could not parse fallback ExecutorData JSON.", true);
      }
    }
  }
  if (!ephemeralHasDraftAction) {
    log("[BatchProcessAction] No ephemeral or fallback JSON with draftAction. We may just show an alert or skip.");
    showAlert2("BatchProcessAction", "No 'draftAction' found in ephemeral JSON or ExecutorData. Nothing to process.");
    return;
  }
  let params = ephemeralJson.params || {};
  log("[BatchProcessAction] params = " + JSON.stringify(params));
  if (params.tasks) {
    log("[BatchProcessAction] Found tasks array. We'll re-queue 'ProcessItemsAction' with these tasks.");
    let storeObj = {
      draftAction: "ProcessItemsAction",
      tasks: params.tasks
    };
    let storeJson = JSON.stringify(storeObj);
    draft.setTemplateTag("ExecutorData", storeJson);
    log("[BatchProcessAction] Set ExecutorData with items to process.");
    const executor = Action.find("Drafts Action Executor");
    if (!executor) {
      log("[BatchProcessAction] Could not find 'Drafts Action Executor'", true);
      showAlert2("Error", "Couldn't find Drafts Action Executor to continue.");
      return;
    }
    let success = app.queueAction(executor, draft);
    if (success) {
      log("[BatchProcessAction] Successfully queued Drafts Action Executor.");
    } else {
      log("[BatchProcessAction] Failed to queue Drafts Action Executor!", true);
    }
    return;
  }
  log("[BatchProcessAction] No tasks provided, so finishing. You can implement custom logic here.");
  showAlert2("BatchProcessAction Complete", "Nothing to process or queued next step successfully.");
  draft.addTag("status::batch-processed");
  draft.update();
}
// src/executor/Executor.ts
function parseEphemeralJson() {
  let jsonData = {};
  let usedEphemeral = false;
  try {
    const parsed = JSON.parse(draft.content.trim());
    if (parsed && parsed.draftAction) {
      jsonData = parsed;
      usedEphemeral = true;
      log("[Executor] Found ephemeral JSON with action: " + jsonData.draftAction);
    }
  } catch {
    log("[Executor] No valid ephemeral JSON found in draft.content, continuing...");
  }
  if (!usedEphemeral) {
    const fallbackData = draft.getTemplateTag("ExecutorData");
    if (fallbackData) {
      log("[Executor] Found fallback JSON in 'ExecutorData' tag.");
      try {
        const parsedFallback = JSON.parse(fallbackData);
        Object.assign(jsonData, parsedFallback);
      } catch {
        log("[Executor] Could not parse fallback JSON from ExecutorData.", true);
      }
    }
  }
  return jsonData;
}
async function runDraftsActionExecutor() {
  if (draft.hasTag("status::processed")) {
    log("[Executor] Ephemeral draft has 'status::processed'; skipping re-processing.");
    return;
  }
  try {
    log("[Executor] Starting runDraftsActionExecutor...");
    log(`[Executor] Ephemeral draft content:
` + draft.content);
    let jsonData = parseEphemeralJson();
    if (!jsonData.draftAction) {
      log("[Executor] No 'draftAction' found in ephemeral/fallback JSON.");
      const buttonPressed = showPromptWithButtons("No draftAction Found", "Would you like to pick an action to run on the currently loaded draft in the editor?", ["Pick Action", "Cancel"]);
      if (!buttonPressed) {
        log("[Executor] User canceled or no ephemeral JSON. Exiting.");
        return;
      }
      const chosenActionName = showPromptWithButtons("Select Action", "Choose an action to run on this draft:", ["MyActionName", "BatchProcessAction", "Cancel"]);
      if (!chosenActionName) {
        log("[Executor] User canceled second prompt. Exiting.");
        return;
      }
      log("[Executor] User selected fallback action: " + chosenActionName);
      const fallbackAction = Action.find(chosenActionName);
      if (!fallbackAction) {
        showAlert2("Action Not Found", `Could not find an action named: "${chosenActionName}"`);
        return;
      }
      const success2 = app.queueAction(fallbackAction, draft);
      if (!success2) {
        log(`Failed to queue fallback action "${chosenActionName}".`, true);
      } else {
        log(`Queued fallback action "${chosenActionName}" successfully.`);
      }
      return;
    }
    log(`[Executor] Parsed ephemeral JSON:
` + JSON.stringify(jsonData, null, 2));
    const actionName = jsonData.draftAction;
    log("[Executor] actionName: " + (actionName || "undefined"));
    if (!actionName) {
      showAlert2("No Action Provided", "Please provide 'draftAction' in the JSON.");
      return;
    }
    let realDraft = null;
    if (jsonData.draftData) {
      log("[Executor] Found draftData. Creating a new real draft...");
      realDraft = Draft.create();
      if (typeof jsonData.draftData.content === "string") {
        realDraft.content = jsonData.draftData.content;
      }
      if (jsonData.draftData.title) {
        realDraft.addTag("title:" + jsonData.draftData.title);
      }
      if (jsonData.draftData.flagged === true) {
        realDraft.isFlagged = true;
      }
      realDraft.setTemplateTag("DraftData", JSON.stringify(jsonData.draftData));
      realDraft.update();
      log("[Executor] Created new real draft, UUID = " + realDraft.uuid);
    } else {
      log("[Executor] No draftData in ephemeral JSON.");
    }
    let draftForAction = realDraft || draft;
    if (jsonData.params) {
      log("[Executor] Found params. Storing in 'CustomParams' tag on draft.");
      draftForAction.setTemplateTag("CustomParams", JSON.stringify(jsonData.params));
    }
    const actionToQueue = Action.find(actionName);
    if (!actionToQueue) {
      showAlert2("Action Not Found", `Could not find an action named: "${actionName}"`);
      return;
    }
    log("[Executor] Queuing action: " + actionName + " on draft: " + draftForAction.uuid);
    const success = app.queueAction(actionToQueue, draftForAction);
    if (!success) {
      log(`Failed to queue action "${actionName}".`, true);
    } else {
      log(`Queued action "${actionName}" successfully.`);
      draft.addTag("status::processed");
      draft.update();
    }
  } catch (error) {
    log(`[Executor] Error in runDraftsActionExecutor: ${String(error)}`, true);
  } finally {
    if (!draft.isTrashed) {
      draft.trash();
      log("Trashed ephemeral JSON draft (UUID: " + draft.uuid + ").");
    }
  }
}
function queueJsonAction(jsonData, skipTrashing = false) {
  const ephemeralContent = JSON.stringify(jsonData);
  draft.content = ephemeralContent;
  draft.update();
  log(`[Executor] queueJsonAction wrote ephemeral JSON to draft:
${ephemeralContent}`);
  const executorAction = Action.find("Drafts Action Executor");
  if (!executorAction) {
    showAlert2("Executor Not Found", "Unable to locate 'Drafts Action Executor'.");
    return;
  }
  const success = app.queueAction(executorAction, draft);
  if (!success) {
    log("[Executor] Failed to queue Drafts Action Executor with ephemeral JSON", true);
  } else {
    log("[Executor] Successfully queued ephemeral JSON via queueJsonAction().");
    if (!skipTrashing) {
    }
  }
}

// src/Flows/ManageDraftFlow.ts
function runManageDraftFlow() {
  if (!draft) {
    log("No loaded draft!");
    script.complete();
    return;
  }
  const folder = app.currentWorkspace.loadFolder ?? "all";
  log("Workspace folder: " + folder);
  const buttonPressed = showPromptWithButtons("Manage Draft Flow", `Folder: ${folder} || Draft: "${draft.title}"
(${draft.uuid})`, [
    "Trash",
    "Move to Inbox",
    "Archive",
    "Queue: MyActionName",
    "Process Source",
    "Cancel"
  ]);
  if (!buttonPressed) {
    log("User canceled ManageDraftFlow.");
    script.complete();
    return;
  }
  switch (buttonPressed) {
    case "Trash": {
      if (!draft.isTrashed) {
        draft.isTrashed = true;
        draft.update();
      }
      break;
    }
    case "Move to Inbox": {
      draft.isTrashed = false;
      draft.isArchived = false;
      draft.update();
      break;
    }
    case "Archive": {
      draft.isArchived = true;
      draft.update();
      break;
    }
    case "Queue: MyActionName": {
      const ephemeralJson = { draftAction: "MyActionName" };
      queueJsonAction(ephemeralJson);
      break;
    }
    case "Process Source": {
      runSourceIntegration();
      break;
    }
  }
  script.complete();
}

// src/Actions/ManageDraftWithPromptExecutor.ts
function runManageDraftWithPromptExecutor() {
  runManageDraftFlow();
}
// src/Actions/TaskActions/DailyDriverMenu.ts
async function runDailyDriverMenu() {
  const todoist = getTodoistCredential();
  const mainPrompt = new Prompt;
  mainPrompt.title = "Daily Driver";
  mainPrompt.message = "Quickly manage tasks for today. Choose an option:";
  mainPrompt.addButton("Handle Overdue Tasks Individually");
  mainPrompt.addButton("Shift Entire Day’s Schedule");
  mainPrompt.addButton("Complete All Overdue Tasks");
  mainPrompt.addButton("Cancel");
  if (!mainPrompt.show() || mainPrompt.buttonPressed === "Cancel") {
    log("User canceled the daily driver menu.");
    script.complete();
    return;
  }
  try {
    switch (mainPrompt.buttonPressed) {
      case "Handle Overdue Tasks Individually":
        await handleOverdueTasksIndividually(todoist);
        break;
      case "Shift Entire Day’s Schedule":
        await shiftAllTodayTasksBy(todoist);
        break;
      case "Complete All Overdue Tasks":
        await completeAllOverdueTasks(todoist);
        break;
    }
  } catch (err) {
    log("Error in DailyDriverMenu: " + String(err), true);
  }
  script.complete();
}
async function handleOverdueTasksIndividually(todoist) {
  log("Fetching overdue tasks for today...");
  const overdueTasks = await todoist.getTasks({ filter: "overdue | today" });
  if (!overdueTasks || overdueTasks.length === 0) {
    showAlert2("No Overdue Tasks", "You have no overdue tasks for today.");
    return;
  }
  for (const task of overdueTasks) {
    log(`Processing overdue task: ${task.content}`);
    const p = new Prompt;
    p.title = "Overdue Task";
    p.message = `Task: "${task.content}"
Choose an action:`;
    p.addButton("Reschedule to Later Today");
    p.addButton("Reschedule to Tomorrow");
    p.addButton("Remove Due Date");
    p.addButton("Complete Task");
    p.addButton("Skip");
    if (!p.show() || p.buttonPressed === "Skip") {
      log(`Skipping task "${task.content}"`);
      continue;
    }
    switch (p.buttonPressed) {
      case "Reschedule to Later Today": {
        const laterToday = new Date;
        laterToday.setHours(18, 0, 0, 0);
        const updateOptions = {
          content: task.content,
          due_string: "today 6pm"
        };
        const updateSuccess = await todoist.updateTask(task.id, updateOptions);
        if (updateSuccess) {
          log(`Rescheduled "${task.content}" to later today via REST v2.`);
        } else {
          log(`Failed to reschedule "${task.content}" - ${todoist.lastError}`, true);
        }
        break;
      }
      case "Reschedule to Tomorrow": {
        const tomorrow = new Date;
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const updateOptionsTomorrow = {
          content: task.content,
          due_string: "tomorrow"
        };
        const updateSuccessTomorrow = await todoist.updateTask(task.id, updateOptionsTomorrow);
        if (updateSuccessTomorrow) {
          log(`Rescheduled "${task.content}" to tomorrow via REST v2.`);
        } else {
          log(`Failed to reschedule "${task.content}" - ${todoist.lastError}`, true);
        }
        break;
      }
      case "Remove Due Date": {
        const removeUpdateOptions = {
          content: task.content,
          due_string: "no date"
        };
        const removeSuccess = await todoist.updateTask(task.id, removeUpdateOptions);
        if (removeSuccess) {
          log(`Removed due date from "${task.content}" via REST v2.`);
        } else {
          log(`Failed to remove due date for "${task.content}" - ${todoist.lastError}`, true);
        }
        break;
      }
      case "Complete Task":
        await todoist.closeTask(task.id);
        log(`Completed "${task.content}".`);
        break;
    }
  }
}
async function shiftAllTodayTasksBy(todoist) {
  log("Fetching tasks for today to shift them...");
  const todayTasks = await todoist.getTasks({ filter: "due: today" });
  if (!todayTasks || todayTasks.length === 0) {
    showAlert2("No Today Tasks", "You have no tasks scheduled for today.");
    return;
  }
  const p = new Prompt;
  p.title = "Shift Today’s Tasks";
  p.message = "Enter how many minutes to push all tasks forward:";
  p.addButton("15");
  p.addButton("30");
  p.addButton("45");
  p.addButton("60");
  p.addButton("Custom");
  p.addButton("Cancel");
  if (!p.show() || p.buttonPressed === "Cancel") {
    log("User canceled shifting tasks.");
    return;
  }
  let shiftMinutes = 0;
  switch (p.buttonPressed) {
    case "15":
    case "30":
    case "45":
    case "60":
      shiftMinutes = parseInt(p.buttonPressed);
      break;
    case "Custom": {
      const customPrompt = new Prompt;
      customPrompt.title = "Custom Shift";
      customPrompt.message = "Enter number of minutes to shift tasks:";
      customPrompt.addButton("OK");
      customPrompt.addButton("Cancel");
      if (!customPrompt.show() || customPrompt.buttonPressed === "Cancel") {
        log("User canceled custom shift.");
        return;
      }
      showAlert2("Not Implemented", "Custom input for shifting is not yet implemented in this example.");
      return;
    }
  }
  for (const task of todayTasks) {
    if (task.due?.datetime) {
      try {
        const oldTime = new Date(task.due.datetime);
        oldTime.setMinutes(oldTime.getMinutes() + shiftMinutes);
        const newTimeISO = oldTime.toISOString();
        const success = await todoist.updateTask(task.id, {
          content: task.content,
          due_datetime: newTimeISO
        });
        if (!success) {
          log(`Failed to shift task ${task.content}`, true);
        } else {
          log(`Shifted "${task.content}" by ${shiftMinutes} minutes.`);
        }
      } catch (err) {
        log(`Error shifting "${task.content}": ${String(err)}`, true);
      }
    }
  }
  showAlert2("Tasks Shifted", `All tasks for today have been shifted by ${shiftMinutes} minutes.`);
}
async function completeAllOverdueTasks(todoist) {
  log("Fetching overdue tasks to mark complete...");
  const overdueTasks = await todoist.getTasks({ filter: "overdue" });
  if (!overdueTasks || overdueTasks.length === 0) {
    showAlert2("No Overdue Tasks", "You have no overdue tasks to complete.");
    return;
  }
  for (const task of overdueTasks) {
    try {
      const closeSuccess = await todoist.closeTask(task.id);
      if (!closeSuccess) {
        log(`Failed to complete "${task.content}"`, true);
      } else {
        log(`Completed overdue task "${task.content}".`);
      }
    } catch (err) {
      log(`Error completing overdue task: ${String(err)}`, true);
    }
  }
  showAlert2("Overdue Tasks Completed", "All overdue tasks have been closed.");
}
// src/Actions/AiTextToCalendar.ts
async function runAiTextToCalendar() {
  try {
    const selectedText = editor.getSelectedText()?.trim();
    const userText = selectedText && selectedText.length > 0 ? selectedText : draft.content.trim();
    if (!userText) {
      showAlert2("No Text", "Draft has no content or selection to parse.");
      return;
    }
    log(`[AiTextToCalendar] Starting extraction with userText:
` + userText);
    const systemMessage = `Extract schedule information from the text provided by the user.
The output should be in the following JSON format.

{
  "title": "string",         // Event title
  "start_date": "YYYYMMDD",  // Start date
  "start_time": "hhmmss",    // Start time
  "end_date": "YYYYMMDD",    // End date
  "end_time": "hhmmss",      // End time
  "details": "string",       // Summary in up to 3 concise sentences. URLs should be preserved.
  "location": "string"       // Event location
}

Note:
* Output in English
* Do not include any content other than the JSON format in the output
* If the organizer's name is known, include it in the title
* Ensure the location is easily identifiable
* If the end date/time are unknown, set them 2 hours after the start date/time
`;
    const ai = OpenAI.create();
    ai.model = "gpt-3.5-turbo";
    const fullPrompt = `${systemMessage}

${userText}`;
    log("[AiTextToCalendar] Sending prompt to OpenAI. This may take a few seconds...");
    const aiResponse = ai.quickChatResponse(fullPrompt, {
      temperature: 0.2,
      max_tokens: 256
    });
    log(`[AiTextToCalendar] Received raw response:
` + aiResponse);
    let calendarEvent;
    try {
      calendarEvent = JSON.parse(aiResponse);
    } catch (err) {
      showAlert2("Parsing Error", `Unable to parse AI response as valid JSON.

` + String(err));
      return;
    }
    const calendarUrl = toGoogleCalendarURL(calendarEvent);
    copyToClipboard(calendarUrl);
    app.openURL(calendarUrl);
    showAlert2("Extracted!", "Calendar link opened & copied to clipboard.");
  } catch (error) {
    const errMsg = String(error);
    log(`[AiTextToCalendar] Failure:
` + errMsg, true);
    showAlert2("Cannot transform text", errMsg);
  }
}
function toGoogleCalendarURL(event) {
  const textParam = encodeURIComponent(event.title);
  const datesParam = `${event.start_date}T${event.start_time}/${event.end_date}T${event.end_time}`;
  const detailsParam = encodeURIComponent(event.details);
  const locationParam = encodeURIComponent(event.location);
  const url = `https://calendar.google.com/calendar/render` + `?action=TEMPLATE` + `&text=${textParam}` + `&dates=${datesParam}` + `&details=${detailsParam}` + `&location=${locationParam}` + `&trp=false`;
  return url;
}

// src/index.ts
class FallbackSourceItem extends SourceItem {
  async performAction() {
    console.log("[FallbackSourceItem] No recognized source type. Nothing to do.");
    app.displayInfoMessage("Fallback: no recognized source item found.");
  }
}
async function runSourceIntegration2() {
  try {
    console.log("SourceIntegration: script started.");
    const title = draft.title;
    let selectedText = editor.getSelectedText();
    if (!selectedText) {
      const range = editor.getSelectedLineRange();
      selectedText = editor.getTextInRange(range[0], range[1]);
    }
    console.log(`[SourceIntegration] Draft title: "${title}"`);
    console.log(`[SourceIntegration] Selected text length: ${selectedText ? selectedText.length : 0}`);
    const taskInfo = {
      sourceType: null,
      identifier: null
    };
    const patterns = {
      todoist: /^task_(\d+)$/,
      jira: /^issue_([A-Z]+-\d+)$/
    };
    if (!title || title.trim() === "") {
      console.log("Draft title is empty or undefined.");
      app.displayWarningMessage("Draft title is missing.");
      cancelAction("No recognized patterns found");
      return;
    }
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
      const ghPattern = /^(ghissue|ghpr|ghgist)_(.*)$/;
      const ghMatch = ghPattern.exec(title);
      if (ghMatch) {
        taskInfo.sourceType = "github";
        if (ghMatch[1] === "ghissue") {
          taskInfo.itemType = "issue";
        } else if (ghMatch[1] === "ghpr") {
          taskInfo.itemType = "pr";
        } else if (ghMatch[1] === "ghgist") {
          taskInfo.itemType = "gist";
        }
        taskInfo.identifier = ghMatch[2];
        console.log(`Source type identified as GitHub: itemType=${taskInfo.itemType}, identifier=${taskInfo.identifier}`);
      } else {
        console.log("[SourceIntegration] No recognized source type. We'll fallback.");
      }
    }
    if (!taskInfo.sourceType) {
      console.log("[SourceIntegration] No recognized source type. We'll fallback.");
    } else {
      console.log("[SourceIntegration] Detected sourceType:", taskInfo.sourceType);
    }
    let sourceItem;
    if (taskInfo.sourceType && taskInfo.identifier) {
      switch (taskInfo.sourceType) {
        case "todoist":
          sourceItem = new TodoistTask(draft, selectedText, taskInfo.identifier);
          break;
        case "jira":
          sourceItem = new JiraIssue(draft, selectedText, taskInfo.identifier);
          break;
        case "github":
          if (taskInfo.itemType) {
            sourceItem = new GitHubItem(draft, selectedText, taskInfo.identifier, taskInfo.itemType);
          } else {
            sourceItem = new FallbackSourceItem(draft, selectedText);
          }
          break;
        default:
          sourceItem = new FallbackSourceItem(draft, selectedText);
          break;
      }
    } else {
      sourceItem = new FallbackSourceItem(draft, selectedText);
    }
    let actionsToShow = taskInfo.sourceType && SourceActionRegistry[taskInfo.sourceType] ? SourceActionRegistry[taskInfo.sourceType] : [];
    if (!actionsToShow || actionsToShow.length === 0) {
      console.log("[SourceIntegration] Using fallback actions from registry.");
      actionsToShow = SourceActionRegistry.fallback;
    }
    const p = new Prompt;
    p.title = "Available Actions";
    for (const item of actionsToShow) {
      p.addButton(item.label);
    }
    p.addButton("Cancel");
    const didShow = p.show();
    if (!didShow || p.buttonPressed === "Cancel") {
      console.log("[SourceIntegration] User canceled the actions prompt.");
      cancelAction("User canceled the prompt");
      return;
    }
    const chosenLabel = p.buttonPressed;
    const chosenAction = actionsToShow.find((a) => a.label === chosenLabel);
    if (!chosenAction) {
      console.log("[SourceIntegration] No matching action found. Exiting.");
      cancelAction("No recognized action from prompt");
      return;
    }
    console.log("[SourceIntegration] Running chosen action:", chosenLabel);
    await chosenAction.run(sourceItem);
  } catch (error) {
    console.error("Error in runSourceIntegration main script:", error);
    app.displayErrorMessage("An unexpected error occurred.");
  } finally {
    console.log("SourceIntegration: script completed.");
    script.complete();
  }
}
globalThis.runSourceIntegration = runSourceIntegration2;
