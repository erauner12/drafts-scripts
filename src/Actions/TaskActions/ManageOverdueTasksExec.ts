import { Task } from "@doist/todoist-api-typescript";
import { logCustomMessage } from "../../helpers-utils";

// Re-define helper functions for rescheduling or completing tasks
async function rescheduleTasksToToday(
  todoistClient: Todoist,
  tasks: Task[]
): Promise<void> {
  for (const task of tasks) {
    try {
      logCustomMessage("Rescheduling task " + task.id + " to today...");
      await todoistClient.updateTask(task.id, {
        due_string: "today at 23:59",
        due_lang: "en",
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

async function completeTasks(
  todoistClient: Todoist,
  tasks: Task[]
): Promise<void> {
  for (const task of tasks) {
    try {
      logCustomMessage("Completing task " + task.id + "...");
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

/**
 * This function reads user selections from custom template tags set in ManageOverdueTasks.ts
 * and performs the actual API calls to Todoist.
 */
export async function executeOverdueTasksAction(): Promise<void> {
  logCustomMessage(
    "executeOverdueTasksAction() invoked. Starting execution step."
  );

  try {
    // read the template tags previously set in manageOverdueTasks
    const selectedTasksData = draft.getTemplateTag("OverdueTasksData") || "";
    const selectedAction = draft.getTemplateTag("OverdueTasksAction") || "";

    if (!selectedTasksData || !selectedAction) {
      logCustomMessage(
        "No stored tasks or action found in template tags. Exiting."
      );
      alert(
        "No overdue tasks or action found. Make sure you ran Step 1 first."
      );
      return;
    }

    const selectedTasks = JSON.parse(selectedTasksData) as Task[];

    // Re-authorize credentials, fetch token
    logCustomMessage("Re-authorizing Todoist credentials...");
    const credential = Credential.create("Todoist", "Todoist API Token");
    credential.addPasswordField("apiToken", "API Token");
    credential.authorize();
    logCustomMessage("Credentials authorized successfully.");

    const TODOIST_API_TOKEN = credential.getValue("apiToken");
    const todoist = Todoist.create();
    todoist.token = TODOIST_API_TOKEN;
    logCustomMessage("Todoist API token set.");

    // Perform the requested action
    if (selectedAction === "Reschedule to Today") {
      await rescheduleTasksToToday(todoist, selectedTasks);
    } else if (selectedAction === "Complete Tasks") {
      await completeTasks(todoist, selectedTasks);
    } else {
      logCustomMessage(`Unknown action: ${selectedAction}`, true);
      alert("Unknown action selected: " + selectedAction);
    }

    alert("Tasks processed successfully!");
    logCustomMessage("executeOverdueTasksAction() finished successfully.");
  } catch (error) {
    logCustomMessage("Error in executeOverdueTasksAction: " + error, true);
    alert("An error occurred: " + error);
  }
}
