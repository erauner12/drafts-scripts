import { getTodoistCredential, log } from "../../helpers/helpers-utils";
import {
  handleDeadlineTasks,
  handleNoDurationTasks,
  handleNoTimeTasks,
  handleOverdueTasks,
} from "./TaskMenus";

declare var script: { complete(): void };

interface TodoistTask {
  id: number;
  content: string;
  due?: {
    string?: string;
    date?: string;
    datetime?: string;
  };
  duration?: any;
}

interface Todoist {
  getTasks(options: { filter: string }): Promise<TodoistTask[]>;
  updateTask(taskId: number, options: any): Promise<boolean>;
  lastError?: string;
  token: string;
}

export async function runTodoistEnhancedMenu(): Promise<void> {
  const todoist = getTodoistCredential();

  // Present the user with a main menu of categories
  let mainPrompt = new Prompt();
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

  let tasksToStore: TodoistTask[] = [];

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
  showAlert(
    "Tasks Fetched",
    "Tasks have been stored in the 'TasksForSelection' template tag. You may now run selectTasksStep to pick which tasks to act on."
  );
  script.complete();
}
