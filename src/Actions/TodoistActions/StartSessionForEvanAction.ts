import { quickAlert, failAction } from "../../helpers/CommonFlowUtils";

declare var app: App;
declare var device: Device;

export async function runStartSessionForEvan(
  todoist: Todoist,
  taskId: string
): Promise<void> {
  try {
    console.log("Starting session for Evan...");

    const task = todoist.getTask(taskId);
    if (!task) {
      quickAlert("Failed to retrieve task details.", "Task is undefined", true);
      return;
    }

    const duration = 25; // minutes
    interface TodoistComment {
      content: string;
      posted_at: string;
    }
    const comments = todoist.getComments({
      task_id: taskId,
    }) as TodoistComment[];
    let lastComment = "";
    if (comments && comments.length > 0) {
      lastComment = comments[comments.length - 1].content;
    }

    const title = task.content || "No Title";
    const description = task.description || "No Description";
    const allComments =
      comments.map((c: any) => c.content).join("\n\n---\n\n") || "No Comments";

    // Fix: ensure it's ${allComments}, not truncated
    const notes = `${lastComment}

---

${title}

${description}

---

${allComments}`;

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
    console.error("Error in runStartSessionForEvan:", error);
    failAction("Failed to start session.", error);
  }
}