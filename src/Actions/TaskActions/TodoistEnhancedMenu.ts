import { getTodoistCredential, log, showAlert } from "../../helpers-utils";
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

  function getTodayDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  // Fetch tasks that are due: today
  log("Fetching tasks due today...");
  let allTasks: TodoistTask[] = [];
  try {
    allTasks = (await todoist.getTasks({
      filter: "due: today",
    })) as TodoistTask[];
    log(`Fetched ${allTasks.length} tasks due today.`);
  } catch (error) {
    log(`Unhandled error while fetching today's tasks: ${error}`, true);
    showAlert("Script Error", `Error fetching tasks: ${error}`);
    script.complete();
    return;
  }

  // Separate tasks into categories
  let todayStr = getTodayDate();
  let tasksNoTime: TodoistTask[] = [];
  let tasksNoDuration: TodoistTask[] = [];

  for (let task of allTasks) {
    if (task.due && task.due.date === todayStr) {
      if (!task.due.datetime) {
        tasksNoTime.push(task);
      }
      if (!task.duration) {
        tasksNoDuration.push(task);
      }
    }
  }

  // Create main menu
  let mainPrompt = new Prompt();
  mainPrompt.title = "Manage Tasks";
  mainPrompt.message = "Select which category you want to manage:";
  mainPrompt.addButton("Tasks Due Today (No Time)");
  mainPrompt.addButton("Tasks Due Today (No Duration)");
  mainPrompt.addButton("Overdue Tasks");
  mainPrompt.addButton("Deadline Tasks (Today/Tomorrow)");
  mainPrompt.addButton("Cancel");

  if (!mainPrompt.show()) {
    log("User cancelled the main prompt.");
    script.complete();
    return;
  }

  switch (mainPrompt.buttonPressed) {
    case "Tasks Due Today (No Time)":
      await handleNoTimeTasks(todoist, tasksNoTime);
      break;
    case "Tasks Due Today (No Duration)":
      await handleNoDurationTasks(todoist, tasksNoDuration);
      break;
    case "Overdue Tasks":
      await handleOverdueTasks(todoist);
      break;
    case "Deadline Tasks (Today/Tomorrow)":
      await handleDeadlineTasks(todoist);
      break;
    default:
      log("User cancelled the operation.");
      script.complete();
      return;
  }

  log("Script completed successfully.");
  script.complete();
}
