import { quickAlert } from "../../helpers/CommonFlowUtils";

declare var app: App;

export async function runExportToNewDraft(
  todoist: Todoist,
  taskId: string
): Promise<boolean> {
  try {
    console.log("Exporting Todoist task to new draft...");
    const task = todoist.getTask(taskId) as {
      id: string;
      content: string;
      description?: string;
      createdAt?: string;
      due?: { date: string };
      priority?: number;
    };
    const comments = todoist.getComments({ task_id: taskId });

    // Build up the content more carefully
    let content = `# ${task.content}\n\n`;
    if (task.description) {
      content += `${task.description}\n\n`;
    }

    content += "## Task Metadata\n";
    content += `- Original Task ID: ${task.id}\n`;

    if (task.createdAt) {
      content += `- Created: ${new Date(task.createdAt).toLocaleString()}\n`;
    }
    if (task.due) {
      content += `- Due: ${new Date(task.due.date).toLocaleString()}\n`;
    }
    if (task.priority && task.priority !== 1) {
      content += `- Priority: ${task.priority}\n`;
    }

    if (comments && comments.length > 0) {
      content += "\n## Comments\n\n";
      content += comments
        .map((c: any) => {
          const timestamp = new Date(c.postedAt).toLocaleString();
          return `#### ${timestamp}\n\n${c.content}`;
        })
        .join("\n\n---\n\n");
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