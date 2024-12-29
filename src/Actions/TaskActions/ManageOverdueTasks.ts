/**
 * ManageOverdueTasks.ts
 *
 * Placeholder for an action-specific script to manage overdue tasks.
 */

// Declarations for unknown Drafts types and global functions
declare function someSharedHelperFunction(): void;
declare function logCustomMessage(msg: string, error?: boolean): void;
declare function alert(message: string): void;
declare var Credential: any;
declare var Todoist: any;
declare var context: any; // used for context.cancel()
declare var Prompt: any;

/**
 * Runs the Manage Overdue Tasks action.
 */
export async function manageOverdueTasks(): Promise<void> {
  someSharedHelperFunction();
  logCustomMessage("Manage Overdue Items script started.");

  try {
    // Initialize Todoist credentials
    const credential = Credential.create("Todoist", "Todoist API Token");
    credential.addPasswordField("apiToken", "API Token");
    credential.authorize();

    const TODOIST_API_TOKEN = credential.getValue("apiToken");
    const todoist = Todoist.create();
    todoist.token = TODOIST_API_TOKEN;

    const tasks = await todoist.getTasks({ filter: "overdue" });
    logCustomMessage("Retrieved " + tasks.length + " overdue tasks");

    if (tasks.length === 0) {
      alert("No overdue tasks found.");
      logCustomMessage("No overdue tasks retrieved from Todoist.");
      return;
    }

    // Collect task contents
    const taskContents = tasks.map((task: any) => task.content);

    // Prompt user to select tasks
    const taskPrompt = new Prompt();
    taskPrompt.title = "Overdue Tasks";
    taskPrompt.message = "Select overdue tasks to reschedule or complete:";
    taskPrompt.addSelect("selectedTasks", "Tasks", taskContents, [], true);
    taskPrompt.addButton("OK");

    if (taskPrompt.show() && taskPrompt.buttonPressed === "OK") {
      const selectedTasks = tasks.filter((task: any) =>
        taskPrompt.fieldValues["selectedTasks"].includes(task.content)
      );
      logCustomMessage("User selected " + selectedTasks.length + " tasks");

      if (selectedTasks.length === 0) {
        logCustomMessage("No tasks selected by the user.");
        alert("No tasks selected.");
        return;
      }

      // Prompt for action
      const actionPrompt = new Prompt();
      actionPrompt.title = "Select Action";
      actionPrompt.message = "Choose an action for the selected tasks:";
      actionPrompt.addButton("Reschedule to Today");
      actionPrompt.addButton("Complete Tasks");

      if (actionPrompt.show()) {
        const userAction = actionPrompt.buttonPressed;
        logCustomMessage("User selected action: " + userAction);

        // Prepare the temporary draft
        // (In Drafts, you might create a new draft to hold these values)
        // @ts-ignore
        const tempDraft = Draft.create();
        tempDraft.addTag("temp");
        tempDraft.setTemplateTag("actionType", userAction);
        tempDraft.setTemplateTag(
          "selectedTasks",
          JSON.stringify(selectedTasks)
        );
        tempDraft.update();

        // If there's an executor function defined, call it here:
        // ExecutorLib_execute(tempDraft);
        // Placeholder for user logic
        alert(
          "Placeholder: tasks would be processed in ExecutorLib_execute()."
        );
      } else {
        logCustomMessage("User cancelled the action prompt.");
      }
    }
  } catch (error: any) {
    logCustomMessage("Error in Manage Overdue Tasks script: " + error, true);
    alert("An error occurred: " + error);
  }
}

/**
 * Example extra placeholder function
 */
export function manageOverdueTasksAux(): void {
  // Example placeholder
  logCustomMessage("ManageOverdueTasks_aux() called!");
}
