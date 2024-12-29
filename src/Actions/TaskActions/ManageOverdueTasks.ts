/**
 * ManageOverdueTasks.ts
 *
 * Script to manage overdue tasks. Additional logging is added for clarity.
 */

import { Task } from "@doist/todoist-api-typescript";
import { logCustomMessage } from "../../helpers-utils";

// Global functions still need declaration
declare function alert(message: string): void;
/**
 * Runs the Manage Overdue Tasks action with more detailed logging.
 */

/**
 * Helper function to reschedule tasks to today using the Todoist API
 */
async function rescheduleTasksToToday(
  todoistClient: Todoist,
  tasks: Task[]
): Promise<void> {
  for (const task of tasks) {
    try {
      logCustomMessage("Rescheduling task " + task.id + " to today...");
      await todoistClient.updateTask(task.id, {
        due_date: new Date().toISOString().split("T")[0],
      });
      logCustomMessage(
        "Task " + task.id + " successfully rescheduled to today."
      );
      const updatedTask = (await todoistClient.getTask(task.id)) as Task;
      if (!updatedTask?.due) {
        logCustomMessage(
          `Task ${task.id} has no due date after update. Something is off.`,
          true
        );
      } else {
        logCustomMessage(
          `Task ${task.id} is now due on: ${updatedTask.due.date}`
        );
      }
    } catch (error) {
      logCustomMessage(
        "Error rescheduling task " + task.id + ": " + String(error),
        true
      );
      alert("Error rescheduling task " + task.id + ": " + String(error));
    }
  }
}

/**
 * Helper function to mark tasks as complete using the Todoist API
 */
async function completeTasks(todoistClient: any, tasks: any[]): Promise<void> {
  for (const task of tasks) {
    try {
      logCustomMessage("Completing task " + task.id + "...");
      // Official doc: https://developer.todoist.com/sync/v9/#close-a-task
      await todoistClient.closeTask(task.id);
      logCustomMessage("Task " + task.id + " has been marked complete.");
    } catch (error) {
      logCustomMessage(
        "Error completing task " + task.id + ": " + String(error),
        true
      );
      alert("Error completing task " + task.id + ": " + String(error));
    }
  }
}

export async function manageOverdueTasks(): Promise<void> {
  logCustomMessage("manageOverdueTasks() invoked. Starting process.");

  try {
    logCustomMessage(
      "Attempting to create and authorize Todoist credentials..."
    );
    const credential = Credential.create("Todoist", "Todoist API Token");
    credential.addPasswordField("apiToken", "API Token");
    credential.authorize();
    logCustomMessage("Credentials authorized successfully.");
    logCustomMessage("System date/time is: " + new Date().toString());
    logCustomMessage("UTC date/time is: " + new Date().toUTCString());
    logCustomMessage(
      "Timezone offset (minutes): " + new Date().getTimezoneOffset().toString()
    );

    const TODOIST_API_TOKEN = credential.getValue("apiToken");
    const todoist = Todoist.create();
    todoist.token = TODOIST_API_TOKEN;
    logCustomMessage("Todoist API token set.");

    logCustomMessage("Fetching tasks filtered by 'overdue'...");
    const tasks = await todoist.getTasks({ filter: "overdue" });
    logCustomMessage("Retrieved " + tasks.length + " overdue tasks.");

    // Log the raw content of each overdue task
    if (tasks.length > 0) {
      const allTaskContents = tasks
        .map((t: any) => t.id + ': "' + t.content + '"')
        .join(", ");
      logCustomMessage("Overdue tasks from Todoist: [" + allTaskContents + "]");
    }

    if (tasks.length === 0) {
      alert("No overdue tasks found.");
      logCustomMessage(
        "No overdue tasks retrieved from Todoist. Exiting script."
      );
      return;
    }

    const taskContents = tasks.map((task: any) => task.content);
    logCustomMessage("Creating prompt for user to select overdue tasks...");

    // Prompt user to select tasks
    const taskPrompt = new Prompt();
    taskPrompt.title = "Overdue Tasks";
    taskPrompt.message = "Select overdue tasks to reschedule or complete:";
    taskPrompt.addSelect("selectedTasks", "Tasks", taskContents, [], true);
    taskPrompt.addButton("OK");

    const didShow = taskPrompt.show();
    logCustomMessage(
      "Task selection prompt displayed: " +
        (didShow ? "User responded" : "User dismissed/canceled")
    );

    if (didShow && taskPrompt.buttonPressed === "OK") {
      const selectedTasks = tasks.filter((task: any) =>
        taskPrompt.fieldValues["selectedTasks"].includes(task.content)
      );
      logCustomMessage(
        "User selected " + selectedTasks.length + " tasks for processing."
      );

      if (selectedTasks.length === 0) {
        logCustomMessage("No tasks selected by the user. Exiting script.");
        alert("No tasks selected.");
        return;
      }

      // Prompt for action
      const actionPrompt = new Prompt();
      actionPrompt.title = "Select Action";
      actionPrompt.message = "Choose an action for the selected tasks:";
      actionPrompt.addButton("Reschedule to Today");
      actionPrompt.addButton("Complete Tasks");

      const actionDidShow = actionPrompt.show();
      logCustomMessage(
        "Action prompt displayed: " +
          (actionDidShow ? "User responded" : "User dismissed/canceled")
      );

      if (actionDidShow) {
        const userAction = actionPrompt.buttonPressed;
        logCustomMessage("User selected action: " + userAction);

        // Instead of actually performing the updates here,
        // store user selections in template tags for next step:
        draft.setTemplateTag("OverdueTasksData", JSON.stringify(selectedTasks));
        draft.setTemplateTag("OverdueTasksAction", userAction);

        alert("Selections saved. Please run the next step to execute changes.");
        logCustomMessage(
          "manageOverdueTasks() completed user prompt logic successfully."
        );
      } else {
        logCustomMessage("User cancelled the action prompt. Exiting script.");
      }
    } else {
      logCustomMessage(
        "User cancelled or dismissed the overdue tasks prompt. Exiting script."
      );
    }
  } catch (error: any) {
    logCustomMessage("Error in Manage Overdue Tasks script: " + error, true);
    alert("An error occurred: " + error);
  } finally {
    logCustomMessage("manageOverdueTasks() end of script reached. Finalizing.");
  }
}

/**
 * Example extra placeholder function for demonstration. Additional logging added.
 */
export function manageOverdueTasksAux(): void {
  logCustomMessage(
    "manageOverdueTasksAux() called. Additional logic could go here."
  );
}
