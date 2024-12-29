import { Task } from "@doist/todoist-api-typescript";
import { logCustomMessage } from "../../helpers-utils";

// Re-define helper functions for rescheduling or completing tasks
async function rescheduleTasksToToday(
  todoistClient: Todoist,
  tasks: Task[]
): Promise<void> {
  for (const task of tasks) {
    try {
      logCustomMessage(
        "Rescheduling task " + task.id + " to today via request()..."
      );
      const endpoint = "https://api.todoist.com/rest/v2/tasks/" + task.id;
      const updateData = {
        due_date: new Date().toISOString().split("T")[0],
        content: task.content,
      };
      const response = await todoistClient.request({
        url: endpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: updateData,
      });
      logCustomMessage(`[HTTP] success: ${response.success}, status: ${response.statusCode}, error: ${response.error}, body: ${response.responseText}`);
      if (!response || response.statusCode !== 204) {
        logCustomMessage(
          `Task ${task.id} update did not return 204. Got ${response.statusCode}.`,
        );
        if (todoistClient.lastError) {
          logCustomMessage(
            `Todoist lastError: ${todoistClient.lastError}`,
          );
        }
      } else {
        logCustomMessage(
          "Task " +
            task.id +
            " successfully rescheduled to today (via request)."
        );
      }
      const updatedTask = (await todoistClient.getTask(task.id)) as Task;
      if (!updatedTask?.due) {
        logCustomMessage(
          `Task ${task.id} has no due date after update. Something is off.`,
        );
        if (todoistClient.lastError) {
          logCustomMessage(
            `Todoist lastError: ${todoistClient.lastError.}`,
          );
        }
      } else {
        const today = new Date().toISOString().split("T")[0];
        if (updatedTask.due.date !== today) {
          const errorMessage = `Task ${task.id} due date ${updatedTask.due.date} is not today (${today}). Update failed.`;
          logCustomMessage(errorMessage, true);
          if (todoistClient.lastError) {
            logCustomMessage(
              `Todoist lastError: ${todoistClient.lastError}`,
            );
          }
          context.fail(errorMessage);
          return;
        }
        logCustomMessage(
          `Task ${task.id} is now due on: ${updatedTask.due.date}`
        );
      }
    } catch (error) {
      logCustomMessage(
        "Error rescheduling task " + task.id + ": " + String(error),
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
      logCustomMessage(`[HTTP] lastError: ${todoistClient.lastError || ""}, lastResponse status: ${todoistClient.lastResponse?.statusCode}, body: ${todoistClient.lastResponse?.responseText}`);
      logCustomMessage("Task " + task.id + " has been marked complete.");
    } catch (error) {
      logCustomMessage(
        "Error completing task " + task.id + ": " + String(error),
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

    const todoist = Todoist.create();
    logCustomMessage("Todoist client initialized.");

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
