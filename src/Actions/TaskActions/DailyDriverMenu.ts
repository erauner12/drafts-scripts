/**
 * DailyDriverMenu.ts
 *
 * This file demonstrates a "daily driver" approach that prioritizes fewer clicks and faster decisions.
 *
 * RECOMMENDED USAGE ORDER:
 *  1) runDailyDriverMenu() - main entry point that provides a prompt to handle overdue tasks individually,
 *     shift today's schedule, or quickly complete all overdue tasks.
 *
 * You can still call these steps independently if needed:
 *   - require("...").handleOverdueTasksIndividually() [Manage overdue tasks one by one]
 *   - require("...").shiftAllTodayTasksBy() [Push today's tasks forward by a set time increment]
 *   - require("...").completeAllOverdueTasks() [Mark all overdue tasks complete in one go]
 *
 * The user can rely on default filters like "overdue" and "due: today" or add new logic as needed.
 *
 * For a typical day-to-day usage:
 *   1. runDailyDriverMenu() to open the main prompt.
 *   2. Based on the chosen option, the script adjusts your tasks quickly.
 *   3. Repeat as necessary to keep your day up to date.
 */

import { getTodoistCredential, log, showAlert } from "../../helpers-utils";

declare var script: { complete(): void };
declare var draft: {
  getTemplateTag(key: string): string | null;
  setTemplateTag(key: string, value: string): void;
};
declare class Prompt {
  title: string;
  message: string;
  buttonPressed: string;
  fieldValues: { [key: string]: any };

  addButton(title: string): void;
  show(): boolean;
}

interface TodoistTask {
  id: number;
  content: string;
  due?: {
    string?: string;
    date?: string;
    datetime?: string;
    is_recurring?: boolean;
  };
}

declare class Todoist {
  static create(identifier?: string): Todoist;
  token: string;
  lastError?: string;

  getTasks(options?: object): Promise<TodoistTask[]>;
  updateTask(taskId: string | number, options: object): Promise<boolean>;
  closeTask(taskId: string | number): Promise<boolean>;
}

/**
 * runDailyDriverMenu()
 *
 * This script is designed for rapid day-to-day task management in Todoist.
 * It focuses on overdue tasks for today and quick scheduling adjustments,
 * including the ability to shift all remaining tasks forward by a set duration
 * (e.g., if you're running 30 minutes behind).
 */
export async function runDailyDriverMenu(): Promise<void> {
  const todoist = getTodoistCredential();

  // Main prompt: choose how to handle your daily schedule
  const mainPrompt = new Prompt();
  mainPrompt.title = "Daily Driver";
  mainPrompt.message = "Quickly manage tasks for today. Choose an option:";
  mainPrompt.addButton("Handle Overdue Tasks Individually");
  mainPrompt.addButton("Shift Entire Day’s Schedule");
  mainPrompt.addButton("Complete All Overdue Tasks");
  mainPrompt.addButton("Cancel");

  if (!mainPrompt.show() || mainPrompt.buttonPressed === "Cancel") {
    log("User canceled the daily driver menu.");
    script.complete();
    return;
  }

  try {
    switch (mainPrompt.buttonPressed) {
      case "Handle Overdue Tasks Individually":
        await handleOverdueTasksIndividually(todoist);
        break;
      case "Shift Entire Day’s Schedule":
        await shiftAllTodayTasksBy(todoist);
        break;
      case "Complete All Overdue Tasks":
        await completeAllOverdueTasks(todoist);
        break;
    }
  } catch (err) {
    log("Error in DailyDriverMenu: " + String(err), true);
  }

  script.complete();
}

/**
 * handleOverdueTasksIndividually(todoist)
 *
 * Fetches tasks that are overdue or due today (and not yet completed),
 * and prompts you to choose actions for each. Speed is the priority.
 */
async function handleOverdueTasksIndividually(todoist: Todoist): Promise<void> {
  log("Fetching overdue tasks for today...");
  const overdueTasks = await todoist.getTasks({ filter: "overdue | today" });
  if (!overdueTasks || overdueTasks.length === 0) {
    showAlert("No Overdue Tasks", "You have no overdue tasks for today.");
    return;
  }

  for (const task of overdueTasks) {
    log(`Processing overdue task: ${task.content}`);
    const p = new Prompt();
    p.title = "Overdue Task";
    p.message = `Task: "${task.content}"\nChoose an action:`;
    p.addButton("Reschedule to Later Today");
    p.addButton("Reschedule to Tomorrow");
    p.addButton("Remove Due Date");
    p.addButton("Complete Task");
    p.addButton("Skip");

    if (!p.show() || p.buttonPressed === "Skip") {
      log(`Skipping task "${task.content}"`);
      continue;
    }

    switch (p.buttonPressed) {
      case "Reschedule to Later Today": {
        if (task.due?.is_recurring) {
          // For recurring tasks, set the date/time via due_date + due_datetime
          const laterToday = new Date();
          laterToday.setHours(18, 0, 0, 0); // 6pm
          await todoist.updateTask(task.id, {
            content: task.content,
            due_date: laterToday.toISOString().split("T")[0],
            due_datetime: laterToday.toISOString()
          });
          log(
            `Rescheduled recurring task "${task.content}" to later today via due_date/due_datetime.`
          );
        } else {
          const updateOptions = {
            content: task.content,
            due_string: "today 6pm",
          };
          await todoist.updateTask(task.id, updateOptions);
          log(`Rescheduled "${task.content}" to later today.`);
        }
        break;
      }
      case "Reschedule to Tomorrow": {
        if (task.due?.is_recurring) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0); // e.g., 9am tomorrow
          await todoist.updateTask(task.id, {
            content: task.content,
            due_date: tomorrow.toISOString().split("T")[0],
            due_datetime: tomorrow.toISOString()
          });
          log(
            `Rescheduled recurring task "${task.content}" to tomorrow via due_date/due_datetime.`
          );
        } else {
          await todoist.updateTask(task.id, {
            content: task.content,
            due_string: "tomorrow",
          });
          log(`Rescheduled "${task.content}" to tomorrow.`);
        }
        break;
      }
      case "Remove Due Date": {
        if (task.due?.is_recurring) {
          // For recurring tasks, set due_date/due_datetime to null
          await todoist.updateTask(task.id, {
            content: task.content,
            due_date: null,
            due_datetime: null
          });
          log(
            `Removed due date (recurring) from "${task.content}" by nulling due_date/due_datetime.`
          );
        } else {
          await todoist.updateTask(task.id, {
            content: task.content,
            due_string: "no date",
          });
          log(`Removed due date from "${task.content}".`);
        }
        break;
      }
      case "Complete Task":
        await todoist.closeTask(task.id);
        log(`Completed "${task.content}".`);
        break;
    }
  }
}

/**
 * shiftAllTodayTasksBy(todoist)
 *
 * Shifts all tasks scheduled for today by a user-specified amount of time,
 * e.g., 30 minutes. This is useful if you start the day late and need to
 * push everything forward.
 */
async function shiftAllTodayTasksBy(todoist: Todoist): Promise<void> {
  log("Fetching tasks for today to shift them...");
  const todayTasks = await todoist.getTasks({ filter: "due: today" });

  if (!todayTasks || todayTasks.length === 0) {
    showAlert("No Today Tasks", "You have no tasks scheduled for today.");
    return;
  }

  // Prompt the user for how many minutes to shift
  const p = new Prompt();
  p.title = "Shift Today’s Tasks";
  p.message = "Enter how many minutes to push all tasks forward:";
  p.addButton("15");
  p.addButton("30");
  p.addButton("45");
  p.addButton("60");
  p.addButton("Custom");
  p.addButton("Cancel");

  if (!p.show() || p.buttonPressed === "Cancel") {
    log("User canceled shifting tasks.");
    return;
  }

  let shiftMinutes = 0;
  switch (p.buttonPressed) {
    case "15":
    case "30":
    case "45":
    case "60":
      shiftMinutes = parseInt(p.buttonPressed);
      break;
    case "Custom": {
      const customPrompt = new Prompt();
      customPrompt.title = "Custom Shift";
      customPrompt.message = "Enter number of minutes to shift tasks:";
      customPrompt.addButton("OK");
      customPrompt.addButton("Cancel");
      if (!customPrompt.show() || customPrompt.buttonPressed === "Cancel") {
        log("User canceled custom shift.");
        return;
      }
      // For simplicity, store user input as 'fieldValues["myInput"]' if using addTextField
      // but here we only have buttons in this minimal example. Expand if needed.
      showAlert(
        "Not Implemented",
        "Custom input for shifting is not yet implemented in this example."
      );
      return;
    }
  }

  // Shift each task by shiftMinutes, if it has a time
  for (const task of todayTasks) {
    if (task.due?.datetime) {
      try {
        const oldTime = new Date(task.due.datetime);
        oldTime.setMinutes(oldTime.getMinutes() + shiftMinutes);
        const newTimeISO = oldTime.toISOString();

        const success = await todoist.updateTask(task.id, {
          content: task.content,
          due_datetime: newTimeISO,
        });
        if (!success) {
          log(`Failed to shift task ${task.content}`, true);
        } else {
          log(`Shifted "${task.content}" by ${shiftMinutes} minutes.`);
        }
      } catch (err) {
        log(`Error shifting "${task.content}": ${String(err)}`, true);
      }
    }
  }
  showAlert(
    "Tasks Shifted",
    `All tasks for today have been shifted by ${shiftMinutes} minutes.`
  );
}

/**
 * completeAllOverdueTasks(todoist)
 *
 * Quickly marks all overdue tasks as complete.
 * Use caution: this might close tasks that should be rescheduled or remain open.
 */
async function completeAllOverdueTasks(todoist: Todoist): Promise<void> {
  log("Fetching overdue tasks to mark complete...");
  const overdueTasks = await todoist.getTasks({ filter: "overdue" });
  if (!overdueTasks || overdueTasks.length === 0) {
    showAlert("No Overdue Tasks", "You have no overdue tasks to complete.");
    return;
  }

  for (const task of overdueTasks) {
    try {
      const closeSuccess = await todoist.closeTask(task.id);
      if (!closeSuccess) {
        log(`Failed to complete "${task.content}"`, true);
      } else {
        log(`Completed overdue task "${task.content}".`);
      }
    } catch (err) {
      log(`Error completing overdue task: ${String(err)}`, true);
    }
  }
  showAlert("Overdue Tasks Completed", "All overdue tasks have been closed.");
}
