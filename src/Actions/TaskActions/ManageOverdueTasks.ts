/**
 * ManageOverdueTasks.ts
 *
 * Script to manage overdue tasks. Additional logging is added for clarity.
 */

// Declarations for unknown Drafts types and global functions
import { logCustomMessage } from "../../helpers-utils";
declare function alert(message: string): void;
declare var Credential: any;
declare var Todoist: any;
declare var context: any; // used for context.cancel()
declare var Prompt: any;
declare var Draft: any;

/**
 * Runs the Manage Overdue Tasks action with more detailed logging.
 */
export async function manageOverdueTasks(): Promise<void> {
  logCustomMessage("manageOverdueTasks() invoked. Starting process.");

  // Some shared helper function used by other scripts. Possibly sets up environment or config.
  try {
    logCustomMessage(
      "Attempting to create and authorize Todoist credentials..."
    );
    const credential = Credential.create("Todoist", "Todoist API Token");
    credential.addPasswordField("apiToken", "API Token");
    credential.authorize();
    logCustomMessage("Credentials authorized successfully.");

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

        // Add more detail about the action to be performed
        if (userAction === "Reschedule to Today") {
          logCustomMessage(
            "The selected tasks will be rescheduled to today (pending actual code to do so)."
          );
        } else if (userAction === "Complete Tasks") {
          logCustomMessage(
            "The selected tasks will be marked complete (pending actual code to do so)."
          );
        }

        // List out the chosen tasks
        if (selectedTasks.length > 0) {
          const chosenTasks = selectedTasks
            .map((t: any) => t.id + ': "' + t.content + '"')
            .join(", ");
          logCustomMessage("Selected tasks: [" + chosenTasks + "]");
        }

        // Prepare the temporary draft to hold data
        // @ts-ignore
        const tempDraft = Draft.create();
        tempDraft.addTag("temp");
        tempDraft.setTemplateTag("actionType", userAction);
        tempDraft.setTemplateTag(
          "selectedTasks",
          JSON.stringify(selectedTasks)
        );
        tempDraft.update();

        logCustomMessage(
          "Temporary draft created with user selections. ID: " + tempDraft.uuid
        );

        // Potentially pass these to an executor function if desired.
        // ExecutorLib_execute(tempDraft);

        alert(
          "Placeholder: tasks would be processed in ExecutorLib_execute()."
        );
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
