/**
 * TodoistFlexibleFlow.ts
 *
 * This file demonstrates a more flexible approach with separate steps:
 *
 * RECOMMENDED USAGE ORDER:
 *  1) runTodoistEnhancedMenu() - fetch tasks from Todoist and store them in a Drafts template tag.
 *  2) selectTasksStep()        - prompt the user to pick tasks from the fetched list, select an action, then store in another template tag.
 *  3) executeSelectedTasksStep() - read those stored tasks and chosen action from the template tags and perform the Todoist updates.
 *
 * You can still call these steps independently if needed:
 *   - Step #1: require("...").selectTasksStep()  [Legacy or custom usage]
 *   - Step #2: require("...").executeSelectedTasksStep() [Legacy or custom usage]
 *
 * The user can specify a filter like "overdue", or "due:today", or "some other search"
 * to gather tasks from Todoist, or rely on the categories offered by runTodoistEnhancedMenu.
 */

import { getTodoistCredential, log } from "../../helpers-utils";
import { moveToFuture, updateToToday } from "./TaskMenus";

declare function alert(message: string): void;
declare var console: { log(msg: string): void };
declare var script: { complete(): void };
declare var draft: {
  setTemplateTag(key: string, value: string): void;
  getTemplateTag(key: string): string | null;
};

declare class Prompt {
  title: string;
  message: string;
  buttonPressed: string;
  fieldValues: { [key: string]: any };

  addButton(title: string): void;
  addSelect(
    key: string,
    label: string,
    items: string[],
    defaultValue?: string[],
    allowMultiple?: boolean
  ): void;
  show(): boolean;
}

interface HTTPResponse {
  success: boolean;
  statusCode: number;
  responseText: string;
  responseData: any;
  error?: string;
}

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

declare class Todoist {
  static create(identifier?: string): Todoist;
  token: string;
  lastError?: string;

  getTasks(options?: object): Promise<TodoistTask[]>;
  updateTask(taskId: string | number, options: object): Promise<boolean>;
  closeTask(taskId: string | number): Promise<boolean>;

  request(settings: {
    url: string;
    method: string;
    headers?: { [key: string]: string };
    parameters?: { [key: string]: string };
    data?: any;
  }): Promise<HTTPResponse>;
}

/**
 * Step #1: Prompt user to select tasks from a specified filter (e.g. 'overdue', 'due: today').
 * Store selected tasks (and user action) in Drafts template tags for the next step.
 *
 * @param filter Filter string for Todoist tasks, e.g. "overdue" or "due: today"
 */
export async function selectTasksStep(): Promise<void> {
  log(
    "selectTasksStep() started. Reading tasks from 'TasksForSelection' template tag."
  );

  try {
    const tasksData = draft.getTemplateTag("TasksForSelection") || "";
    if (!tasksData) {
      alert(
        "No tasks found in 'TasksForSelection'. Did you run the previous step?"
      );
      script.complete();
      return;
    }

    const tasks: TodoistTask[] = JSON.parse(tasksData);
    log(`Found ${tasks.length} tasks from template tag to select from.`);

    if (tasks.length === 0) {
      alert("No tasks to select from.");
      script.complete();
      return;
    }

    // 1) Let user select from the tasks
    const taskTitles = tasks.map((t) => t.content);

    const prompt = new Prompt();
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

    // 2) Get selected tasks from user input
    const selectedContents = prompt.fieldValues["selectedTasks"] || [];
    if (!Array.isArray(selectedContents) || selectedContents.length === 0) {
      alert("No tasks selected.");
      script.complete();
      return;
    }

    // Filter original tasks array to find the selected ones
    const selectedTasks = tasks.filter((t) =>
      selectedContents.includes(t.content)
    );

    // 3) Prompt user for an action
    const actionPrompt = new Prompt();
    actionPrompt.title = "Select Action";
    actionPrompt.message = "Choose an action for the selected tasks:";
    actionPrompt.addButton("Reschedule to Today");
    actionPrompt.addButton("Reschedule to Tomorrow");
    actionPrompt.addButton("Reschedule to Future");
    actionPrompt.addButton("Complete Tasks");
    actionPrompt.addButton("Remove Due Date");
    actionPrompt.addButton("Add Priority Flag");
    actionPrompt.addButton("Cancel");

    const actionDidShow = actionPrompt.show();
    if (!actionDidShow || actionPrompt.buttonPressed === "Cancel") {
      log("User canceled or dismissed the action selection prompt.");
      script.complete();
      return;
    }

    const chosenAction = actionPrompt.buttonPressed;
    log(`User selected action: "${chosenAction}"`);

    // 4) Store the selected tasks + user action in template tags
    draft.setTemplateTag("SelectedTasksData", JSON.stringify(selectedTasks));
    draft.setTemplateTag("SelectedTasksAction", chosenAction);

    alert(
      "Tasks and action have been saved. Run the next step to execute them."
    );
    log("selectTasksStep() completed. Template tags saved.");
    script.complete();
  } catch (error: any) {
    log(`Error in selectTasksStep: ${error}`, true);
    script.complete();
  }
}

/**
 * Step #2: Reads the stored tasks (and chosen action) from template tags,
 * then executes the requested changes in Todoist.
 *
 * This approach is flexible so the user can have multiple "select" steps
 * for different filters or types of tasks, then run this step to finalize everything.
 */
export async function executeSelectedTasksStep(): Promise<void> {
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

    const tasksToProcess: TodoistTask[] = JSON.parse(selectedTasksData);
    log(
      `Retrieved ${tasksToProcess.length} tasks to process with action "${selectedAction}"`
    );

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
            due_string: "tomorrow",
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
      default:
        alert(`Unknown action: ${selectedAction}`);
        log(`Unknown action selected: "${selectedAction}"`, true);
        script.complete();
        return;
    }

    alert("Execution step completed successfully!");
    script.complete();
  } catch (error: any) {
    log(`Error in executeSelectedTasksStep: ${error}`, true);
    script.complete();
  }
}

// Helper methods for the actual execution logic
async function completeTasks(todoist: Todoist, tasks: TodoistTask[]) {
  for (const task of tasks) {
    try {
      log(`Completing task "${task.content}" (id: ${task.id}).`);
      const closeSuccess = await todoist.closeTask(task.id);
      if (!closeSuccess) {
        log(
          `Failed to complete task id: ${task.id} - ${todoist.lastError}`,
          true
        );
      }
    } catch (err) {
      log(`Error completing task id: ${task.id} - ${String(err)}`, true);
    }
  }
}

async function removeTasksDueDate(todoist: Todoist, tasks: TodoistTask[]) {
  for (const task of tasks) {
    try {
      log(`Removing due date for task "${task.content}" (id: ${task.id}).`);
      const updateSuccess = await todoist.updateTask(task.id, {
        content: task.content,
        due_string: "no date",
      });
      if (!updateSuccess) {
        log(
          `Failed to remove due date from task id: ${task.id} - ${todoist.lastError}`,
          true
        );
      }
    } catch (err) {
      log(
        `Error removing due date for task id: ${task.id} - ${String(err)}`,
        true
      );
    }
  }
}

async function setPriorityFlag(todoist: Todoist, tasks: TodoistTask[]) {
  for (const task of tasks) {
    try {
      log(`Setting priority flag for task "${task.content}" (id: ${task.id}).`);
      const updateSuccess = await todoist.updateTask(task.id, {
        content: task.content,
        priority: 4,
      });
      if (!updateSuccess) {
        log(
          `Failed to set priority flag for task id: ${task.id} - ${todoist.lastError}`,
          true
        );
      }
    } catch (err) {
      log(
        `Error setting priority flag for task id: ${task.id} - ${String(err)}`,
        true
      );
    }
  }
}
