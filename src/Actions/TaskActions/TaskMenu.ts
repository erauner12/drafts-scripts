/**
 * TaskMenu.ts
 * Presents a top-level function TaskMenu_run(), which shows a prompt for managing various tasks.
 * Uses a fallback no-op logger if global.Logger is not defined.
 */

// Minimal declarations for Drafts environment
declare function alert(message: string): void;
declare var context: any; // used for context.cancel()
declare var Logger:
  | {
      info: (msg: string) => void;
      warn: (msg: string) => void;
      error: (msg: string) => void;
    }
  | undefined;
declare var Prompt: any;

/**
 * TaskMenu_run
 * Displays a prompt with options for task management, logs user selection, and calls the appropriate code.
 */
export function TaskMenu_run(): void {
  // Use a fallback no-op logger if global.Logger is not defined
  const logger =
    typeof Logger !== "undefined"
      ? Logger
      : {
          info: function () {},
          warn: function () {},
          error: function () {},
        };

  logger.info("TaskMenu: Starting menu prompt.");

  const prompt = new Prompt();
  prompt.title = "Task Management Menu";
  prompt.message = "Select an option to manage your tasks:";

  // Add generic actions here—non-Todoist or any other expansions
  prompt.addButton("Manage Overdue Tasks");
  prompt.addButton("Manage Deadlines");
  prompt.addButton("Schedule Tasks for Tomorrow");
  prompt.addButton("Some Other Custom Action");
  prompt.addButton("Cancel", "cancel", true);

  const didSelect = prompt.show();
  if (!didSelect || prompt.buttonPressed === "Cancel") {
    logger.info("TaskMenu: User canceled or dismissed the prompt.");
    context.cancel();
    return;
  }

  logger.info('TaskMenu: User selected "' + prompt.buttonPressed + '".');

  switch (prompt.buttonPressed) {
    case "Manage Overdue Tasks":
      alert(
        "You selected to manage overdue tasks. (Placeholder for ManageOverdueTasks action.)"
      );
      break;

    case "Manage Deadlines":
      alert(
        "You selected to manage deadlines. (Placeholder for ManageDeadlines action.)"
      );
      break;

    case "Schedule Tasks for Tomorrow":
      alert(
        "You selected to schedule tasks for tomorrow. (Placeholder for scheduling tasks.)"
      );
      break;

    case "Some Other Custom Action":
      alert(
        "You selected another custom action. (Placeholder for non-Todoist or other expansions.)"
      );
      break;

    default:
      logger.warn("TaskMenu: Unexpected button pressed.");
      context.cancel();
      break;
  }
}
