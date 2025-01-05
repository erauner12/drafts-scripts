import { failAction } from "../../helpers/CommonFlowUtils";

declare var app: App;

export function runExportAllInformation(todoist: Todoist, taskId: string): string | null {
  try {
    console.log("Exporting Todoist task information...");
    const task = todoist.getTask(taskId) as {
      id: string;
      content: string;
      description?: string;
    };
    const comments = todoist.getComments({ task_id: taskId });

    let content = "### " + task.content + "\n\n";
    if (task.description) {
      content += task.description + "\n\n";
    }

    // Example code: format comments
    content += comments
      .map((comment: any) => `#### ${new Date(comment.postedAt).toLocaleString()}\n\n${comment.content}`)
      .join("\n\n---\n\n");

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