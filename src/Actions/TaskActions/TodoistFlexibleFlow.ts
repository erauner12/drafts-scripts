/**
 * TodoistFlexibleFlow.ts
 *
 * This file demonstrates a more flexible, two-step approach:
 *  1. selectTasksStep(): Prompt user to select which tasks to act on; store in template tags.
 *  2. executeSelectedTasksStep(): Retrieve stored tasks from template tags and perform updates.
 *
 * You can call these steps from separate Drafts actions or sequential steps:
 *   - Step #1: require("...").selectTasksStep()
 *   - Step #2: require("...").executeSelectedTasksStep()
 *
 * The user can specify a filter like "overdue", or "due:today", or "some other search"
 * to gather tasks from Todoist. Then the user is prompted to pick tasks, choose
 * an action, and the next script step can actually commit those changes in Todoist.
 */

import { log } from "../../helpers-utils";

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
export async function selectTasksStep(filter: string): Promise<void> {
  log(`selectTasksStep() started. Filter used: "${filter}"`);

  try {
    // Provide your Todoist API token
    const credential = Credential.create("Todoist", "Todoist API access");
    credential.addPasswordField("token", "API Token");
    credential.authorize();

    const todoist = Todoist.create();
    todoist.token = credential.getValue("Todoist");

    // 1) Retrieve tasks from Todoist using the filter
    log(`Fetching tasks with filter: "${filter}"...`);
    const tasks = await todoist.getTasks({ filter });
    log(`Found ${tasks.length} tasks with filter: "${filter}"`);

    if (tasks.length === 0) {
      alert(`No tasks found with filter: ${filter}`);
      script.complete();
      return;
    }

    // 2) Let user select from the tasks
    const taskTitles = tasks.map((t) => t.content);

    const prompt = new Prompt();
    prompt.title = `Select Tasks (${filter})`;
    prompt.message = "Select one or more tasks to act on.";
    prompt.addSelect(
      "selectedTasks",
      "Tasks",
      taskTitles,
      [],
      /* allowMultiple: */ true
    );
    prompt.addButton("OK");
    prompt.addButton("Cancel");

    const userDidSelect = prompt.show();
    if (!userDidSelect || prompt.buttonPressed !== "OK") {
      log("User canceled or dismissed the task selection prompt.");
      script.complete();
      return;
    }

    // 3) Get selected tasks from user input
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

    // 4) Prompt user for an action: e.g. "Reschedule to Today", "Complete", etc.
    const actionPrompt = new Prompt();
    actionPrompt.title = "Select Action";
    actionPrompt.message = "Choose an action for the selected tasks:";
    actionPrompt.addButton("Reschedule to Today");
    actionPrompt.addButton("Complete Tasks");
    actionPrompt.addButton("Remove Due Date");
    actionPrompt.addButton("Cancel");

    const actionDidShow = actionPrompt.show();
    if (!actionDidShow || actionPrompt.buttonPressed === "Cancel") {
      log("User canceled or dismissed the action selection prompt.");
      script.complete();
      return;
    }

    const chosenAction = actionPrompt.buttonPressed;
    log(`User selected action: "${chosenAction}"`);

    // 5) Store the selected tasks + user action in template tags for next step
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

  // Provide your Todoist API token again (or retrieve from credential)
  const credential = Credential.create("Todoist", "Todoist API access");
  credential.addPasswordField("token", "API Token");
  credential.authorize();

  const todoist = Todoist.create();
  todoist.token = credential.getValue("token");

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
      case "Reschedule to Today":
        await rescheduleTasksToToday(todoist, tasksToProcess);
        break;
      case "Complete Tasks":
        await completeTasks(todoist, tasksToProcess);
        break;
      case "Remove Due Date":
        await removeTasksDueDate(todoist, tasksToProcess);
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
async function rescheduleTasksToToday(todoist: Todoist, tasks: TodoistTask[]) {
  for (const task of tasks) {
    try {
      log(`Rescheduling task "${task.content}" (id: ${task.id}) to today.`);
      const updateSuccess = await todoist.updateTask(task.id, {
        content: task.content,
        due_string: "today",
      });
      if (!updateSuccess) {
        log(
          `Failed to reschedule task id: ${task.id} - ${todoist.lastError}`,
          true
        );
      }
    } catch (err) {
      log(`Error rescheduling task id: ${task.id} - ${String(err)}`, true);
    }
  }
}

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
