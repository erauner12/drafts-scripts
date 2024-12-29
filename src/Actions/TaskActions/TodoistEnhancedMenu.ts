/**
 * TodoistEnhancedMenu.ts
 *
 * This file provides an enhanced menu flow for Todoist, offering:
 *  - Overdue task handling
 *  - Deadline tasks management
 *  - Time assignment and duration for today's tasks
 *
 * Usage in Drafts:
 *  1) Run "bun run build" or "bun scripts/build.js" to generate the `drafts-actions.js`.
 *  2) In Drafts action step (Script step), do:
 *        require("custom-scripts/drafts-actions.js");
 *        runTodoistEnhancedMenu();
 */

import { log, showAlert } from "../../helpers-utils";

declare var script: {
  complete(): void;
};

declare class Prompt {
  title: string;
  message: string;
  buttonPressed: string;
  fieldValues: { [key: string]: any };

  addButton(title: string): void;
  addDatePicker(
    key: string,
    label: string,
    initialValue: Date,
    options?: { mode?: "date" | "time" | "datetime" }
  ): void;
  addTextField(key: string, label: string, initialValue?: string): void;
  addSelect(
    key: string,
    label: string,
    items: string[],
    defaultValue?: string[],
    allowMultiple?: boolean
  ): void;
  addPicker(
    key: string,
    label: string,
    itemsArray: string[][],
    selectedRowsArray: number[]
  ): void;
  show(): boolean;
}

interface TodoistTask {
  id: number;
  content: string;
  due?: {
    string?: string;
    date?: string;
    datetime?: string;
  };
  deadline?: {
    date: string;
  };
  duration?: any;
}

interface HTTPResponse {
  success: boolean;
  statusCode: number;
  responseText: string;
  responseData: any;
  error?: string;
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
 * Main entry point for the enhanced Todoist menu.
 * Call this function from a Drafts action script step
 * after building the project.
 */
export async function runTodoistEnhancedMenu(): Promise<void> {
  // Provide your Todoist API token here or retrieve from credentials if desired
  const credential = Credential.create(
    "Todoist",
    "Credentials for Todoist API."
  );

  credential.addTextField("token", "Todoist API Token");

  credential.authorize();

  let todoist = Todoist.create();
  todoist.token = credential.getValue("Todoist");

  function getTodayDate(): string {
    let today = new Date();
    return today.toISOString().split("T")[0];
  }

  async function handleOverdueTasks() {
    log("Starting overdue tasks management...");

    let overdueTasks = await todoist.getTasks({ filter: "overdue" });

    if (overdueTasks.length === 0) {
      showAlert("No Overdue Tasks", "You have no overdue tasks to manage.");
      log("No overdue tasks found.");
      return;
    }

    log(`Found ${overdueTasks.length} overdue tasks.`);

    for (let task of overdueTasks) {
      let taskPrompt = new Prompt();
      taskPrompt.title = "Manage Overdue Task";
      taskPrompt.message = `Task: "${task.content}"\nOriginal due: ${
        task.due ? task.due.string : "No date"
      }`;

      taskPrompt.addButton("Update to Today");
      taskPrompt.addButton("Move to Future");
      taskPrompt.addButton("Remove Due Date");
      taskPrompt.addButton("Complete Task");
      taskPrompt.addButton("Delete Task");
      taskPrompt.addButton("Skip");

      if (!taskPrompt.show()) {
        continue;
      }

      switch (taskPrompt.buttonPressed) {
        case "Update to Today":
          await handleUpdateToToday(task);
          break;
        case "Move to Future":
          await handleMoveToFuture(task);
          break;
        case "Remove Due Date":
          await handleRemoveDueDate(task);
          break;
        case "Complete Task":
          await todoist.closeTask(task.id);
          break;
        case "Delete Task":
          await todoist.closeTask(task.id);
          break;
        case "Skip":
          continue;
      }
    }

    showAlert("Completed", "Finished managing deadline tasks.");
  }

  async function handleUpdateToToday(task: TodoistTask) {
    let timePrompt = new Prompt();
    timePrompt.title = "Set Time for Today";
    timePrompt.message = `How should this task be scheduled for today?`;

    timePrompt.addButton("Morning (9 AM)");
    timePrompt.addButton("Noon (12 PM)");
    timePrompt.addButton("No Specific Time");
    timePrompt.addButton("Custom Time");

    if (!timePrompt.show()) return;

    let updateOptions: any = { content: task.content };

    switch (timePrompt.buttonPressed) {
      case "Morning (9 AM)":
        updateOptions.due_string = "today at 9am";
        break;
      case "Noon (12 PM)":
        updateOptions.due_string = "today at 12pm";
        break;
      case "No Specific Time":
        updateOptions.due_string = "today";
        break;
      case "Custom Time":
        let customPrompt = new Prompt();
        customPrompt.addDatePicker("time", "Select Time", new Date(), {
          mode: "time",
        });
        if (customPrompt.show()) {
          let selectedTime: Date = customPrompt.fieldValues["time"];
          let hours = selectedTime.getHours().toString().padStart(2, "0");
          let minutes = selectedTime.getMinutes().toString().padStart(2, "0");
          updateOptions.due_string = `today at ${hours}:${minutes}`;
        }
        break;
    }

    await todoist.updateTask(task.id, updateOptions);
  }

  async function handleMoveToFuture(task: TodoistTask) {
    let datePrompt = new Prompt();
    datePrompt.title = "Move to Future Date";
    datePrompt.message = "When should this task be due?";

    datePrompt.addButton("Tomorrow");
    datePrompt.addButton("Next Week");
    datePrompt.addButton("Custom Date");

    if (!datePrompt.show()) return;

    let updateOptions: any = { content: task.content };

    switch (datePrompt.buttonPressed) {
      case "Tomorrow":
        updateOptions.due_string = "tomorrow";
        break;
      case "Next Week":
        updateOptions.due_string = "next monday";
        break;
      case "Custom Date":
        let customPrompt = new Prompt();
        customPrompt.addDatePicker("date", "Select Date", new Date(), {
          mode: "date",
        });
        if (customPrompt.show()) {
          let selectedDate: Date = customPrompt.fieldValues["date"];
          updateOptions.due_date = selectedDate.toISOString().split("T")[0];
        }
        break;
    }

    await todoist.updateTask(task.id, updateOptions);
  }

  async function handleRemoveDueDate(task: TodoistTask) {
    await todoist.updateTask(task.id, {
      content: task.content,
      due_string: "no date",
    });
  }

  // Over-all execution logic
  try {
    log("Script started.");

    log("Fetching active tasks due today...");
    let allTasks = await todoist.getTasks({ filter: `due: today` });
    log(`Fetched ${allTasks.length} tasks due today.`);

    if (allTasks.length === 0) {
      showAlert("No Tasks", "You have no tasks due today.");
      log("No tasks due today.");
      script.complete();
      return;
    }

    let todayDate = getTodayDate();
    let tasksWithoutTime: TodoistTask[] = [];
    let tasksWithoutDuration: TodoistTask[] = [];

    allTasks.forEach((task) => {
      if (task.due && task.due.date === todayDate) {
        if (!task.due.datetime) {
          tasksWithoutTime.push(task);
        } else {
          if (!task.duration) {
            tasksWithoutDuration.push(task);
          }
        }
      }
    });

    log(
      `Filtered tasks into ${tasksWithoutTime.length} without due time and ${tasksWithoutDuration.length} without duration.`
    );

    let prompt = new Prompt();
    prompt.title = "Manage Tasks";
    prompt.message = "Choose an option to manage your tasks.";

    prompt.addButton("Assign Due Time and Duration");
    prompt.addButton("Assign Duration");
    prompt.addButton("Manage Overdue Tasks");
    prompt.addButton("Manage Deadline Tasks");
    prompt.addButton("Cancel");

    if (!prompt.show()) {
      log("User cancelled the main prompt.");
      script.complete();
      return;
    }

    log(`User selected: ${prompt.buttonPressed}`);

    switch (prompt.buttonPressed) {
      case "Assign Due Time and Duration":
        await handleAssignTimeAndDuration(tasksWithoutTime);
        break;
      case "Assign Duration":
        await handleAssignDuration(tasksWithoutDuration);
        break;
      case "Manage Overdue Tasks":
        await handleOverdueTasks();
        break;
      case "Manage Deadline Tasks":
        await handleDeadlineTasks();
        break;
      default:
        log("User cancelled the operation.");
        script.complete();
        return;
    }

    log("Script completed successfully.");
    script.complete();
  } catch (error: any) {
    log(`Unhandled error in script: ${error}`, true);
    showAlert("Script Error", `An unexpected error occurred: ${error}`);
    script.complete();
  }

  async function handleAssignTimeAndDuration(tasks: TodoistTask[]) {
    if (tasks.length === 0) {
      showAlert("No Tasks", "No tasks found without a due time.");
      log("No tasks to assign due time and duration.");
      return;
    }

    log(`Starting to assign due time and duration for ${tasks.length} tasks.`);

    for (let task of tasks) {
      log(
        `Processing task: ${task.content} (Deadline: ${
          task.deadline ? task.deadline.date : "No deadline"
        })`
      );

      let timePrompt = new Prompt();
      timePrompt.title = "Assign Due Time and Duration";
      timePrompt.message = `Assign a due time and duration for:\n"${task.content}"`;

      timePrompt.addDatePicker("dueTime", "Due Time", new Date(), {
        mode: "time",
      });

      const durations = [
        "15 minutes",
        "30 minutes",
        "1 hour",
        "2 hours",
        "Custom",
      ];
      durations.forEach((duration) => timePrompt.addButton(duration));
      timePrompt.addButton("Skip");

      if (!timePrompt.show()) {
        log(`User skipped assigning due time/duration for "${task.content}"`);
        continue;
      }

      if (durations.includes(timePrompt.buttonPressed)) {
        let selectedDuration = timePrompt.buttonPressed;
        log(`User selected duration: ${selectedDuration}`);

        let dueTime: Date = timePrompt.fieldValues["dueTime"];
        log(`Selected due time: ${dueTime}`);

        let dueDateTime = new Date();
        let [hours, minutes] = dueTime.toTimeString().split(" ")[0].split(":");
        dueDateTime.setHours(parseInt(hours));
        dueDateTime.setMinutes(parseInt(minutes));
        dueDateTime.setSeconds(0);
        let dueDateTimeRFC3339 = dueDateTime.toISOString();

        let updateOptions: any = {
          due_datetime: dueDateTimeRFC3339,
          due_string: `Today at ${hours}:${minutes}`,
        };

        let success = await todoist.updateTask(task.id, updateOptions);
        if (!success) {
          log(
            `Failed to update due time for "${task.content}" - ${todoist.lastError}`,
            true
          );
          continue;
        }

        log(`Updated due time for task: "${task.content}"`);

        if (selectedDuration !== "Custom") {
          let [amount, unitText] = selectedDuration.split(" ");
          let unit = "minute";
          let durationAmount = parseInt(amount);

          if (unitText.startsWith("hour")) {
            durationAmount = durationAmount * 60;
          }

          let durationUpdate: any = {
            content: task.content,
            duration: {
              amount: durationAmount,
              unit: unit,
            },
          };

          let durationSuccess = await todoist.updateTask(
            task.id,
            durationUpdate
          );
          if (durationSuccess) {
            log(
              `Assigned duration: ${durationAmount} ${unit} to "${task.content}"`
            );
          } else {
            log(
              `Failed to assign duration to "${task.content}" - ${todoist.lastError}`,
              true
            );
          }
        } else {
          let customDurationPrompt = new Prompt();
          customDurationPrompt.title = "Custom Duration";
          customDurationPrompt.message = `Enter a custom duration for:\n"${task.content}"`;
          customDurationPrompt.addTextField(
            "customDuration",
            "Duration (e.g., 45 minutes)",
            ""
          );
          customDurationPrompt.addButton("Save");
          customDurationPrompt.addButton("Cancel");

          if (customDurationPrompt.show()) {
            if (customDurationPrompt.buttonPressed === "Save") {
              let customDurationInput =
                customDurationPrompt.fieldValues["customDuration"];
              log(`User entered custom duration: ${customDurationInput}`);

              let customMatch = customDurationInput.match(
                /(\d+)\s*(minute|minutes|hour|hours|day|days)/i
              );
              if (customMatch) {
                let amount = parseInt(customMatch[1]);
                let unitInput = customMatch[2].toLowerCase();
                let unit = "minute";

                if (unitInput.startsWith("hour")) {
                  amount = amount * 60;
                } else if (unitInput.startsWith("day")) {
                  unit = "day";
                }

                let customDurationUpdate: any = {
                  content: task.content,
                  duration: {
                    amount: amount,
                    unit: unit,
                  },
                };

                let customDurationSuccess = await todoist.updateTask(
                  task.id,
                  customDurationUpdate
                );
                if (customDurationSuccess) {
                  log(
                    `Assigned custom duration: ${amount} ${unit} to "${task.content}"`
                  );
                } else {
                  log(
                    `Failed to assign custom duration to "${task.content}" - ${todoist.lastError}`,
                    true
                  );
                }
              } else {
                log(
                  `Invalid custom duration format: "${customDurationInput}"`,
                  true
                );
                showAlert(
                  "Invalid Duration",
                  "Please enter in format like '45 minutes' or '2 hours'."
                );
              }
            } else {
              log(`User cancelled custom duration for "${task.content}"`);
            }
          }
        }
      } else if (timePrompt.buttonPressed === "Skip") {
        log(`User chose to skip task: "${task.content}"`);
        continue;
      } else {
        log(`Unhandled button pressed: ${timePrompt.buttonPressed}`, true);
      }
    }
  }

  async function handleDeadlineTasks() {
    log("Starting deadline tasks management...");

    log("Fetching all tasks...");
    let response = await todoist.request({
      url: "https://api.todoist.com/rest/v2/tasks",
      method: "GET",
    });

    if (!response.success) {
      log(`Failed to fetch tasks - Status code: ${response.statusCode}`, true);
      log(`Error: ${response.error}`);
      showAlert(
        "Error",
        `Failed to fetch tasks from Todoist. Status code: ${response.statusCode}`
      );
      return;
    }

    let allTasks = response.responseData;
    log(`Successfully fetched ${allTasks.length} total tasks`);

    let today = new Date();
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todayStr = today.toISOString().split("T")[0];
    let tomorrowStr = tomorrow.toISOString().split("T")[0];

    let deadlineTasks = allTasks.filter(
      (task: any) =>
        task.deadline &&
        (task.deadline.date === todayStr || task.deadline.date === tomorrowStr)
    );

    log(
      `Found ${deadlineTasks.length} tasks with deadlines for today or tomorrow`
    );

    if (deadlineTasks.length === 0) {
      log("No tasks with deadlines for today or tomorrow");
      showAlert(
        "No Deadline Tasks",
        "No tasks with deadlines for today or tomorrow found."
      );
      return;
    }

    deadlineTasks.sort((a: any, b: any) => {
      if (!a.deadline || !b.deadline) return 0;
      return a.deadline.date.localeCompare(b.deadline.date);
    });

    for (let task of deadlineTasks) {
      log(
        `Processing task: "${task.content}" (Deadline: ${task.deadline.date})`
      );

      let taskPrompt = new Prompt();
      taskPrompt.title = "Manage Deadline Task";
      taskPrompt.message = `Task: "${task.content}"\nDeadline: ${
        task.deadline.date
      } (${task.deadline.date === todayStr ? "Today" : "Tomorrow"})`;

      taskPrompt.addButton("Add Due Date");
      taskPrompt.addButton("Adjust Deadline");
      taskPrompt.addButton("Remove Deadline");
      taskPrompt.addButton("Complete Task");
      taskPrompt.addButton("Skip");

      if (!taskPrompt.show()) {
        log(`Skipped task: "${task.content}"`);
        continue;
      }

      let success = false;
      switch (taskPrompt.buttonPressed) {
        case "Add Due Date":
          success = await handleAddDueDate(task);
          break;
        case "Adjust Deadline":
          success = await handleAdjustDeadline(task);
          break;
        case "Remove Deadline":
          success = await handleRemoveDeadline(task);
          break;
        case "Complete Task":
          success = await todoist.closeTask(task.id);
          if (success) {
            log(`Completed task: "${task.content}"`);
          } else {
            log(
              `Failed to complete task: "${task.content}" - ${todoist.lastError}`,
              true
            );
          }
          break;
        case "Skip":
          log(`Skipped task: "${task.content}"`);
          continue;
      }

      if (!success && taskPrompt.buttonPressed !== "Complete Task") {
        log(`Failed to process task: "${task.content}"`, true);
      }
    }

    showAlert("Completed", "Finished managing deadline tasks.");
  }

  async function handleAddDueDate(task: any): Promise<boolean> {
    let timePrompt = new Prompt();
    timePrompt.title = "Add Due Date";
    timePrompt.message = `Set due date for:\n"${task.content}"`;

    timePrompt.addButton("Same as Deadline");
    timePrompt.addButton("Day Before Deadline");
    timePrompt.addButton("Custom Date/Time");

    if (!timePrompt.show()) return false;

    let updateOptions: any = { content: task.content };

    try {
      switch (timePrompt.buttonPressed) {
        case "Same as Deadline":
          updateOptions.due_date = task.deadline.date;
          break;
        case "Day Before Deadline":
          let beforeDate = new Date(task.deadline.date);
          beforeDate.setDate(beforeDate.getDate() - 1);
          updateOptions.due_date = beforeDate.toISOString().split("T")[0];
          break;
        case "Custom Date/Time":
          let customPrompt = new Prompt();
          customPrompt.addDatePicker(
            "datetime",
            "Select Date and Time",
            new Date(),
            { mode: "datetime" }
          );

          if (!customPrompt.show()) return false;

          let selectedDateTime: Date = customPrompt.fieldValues["datetime"];
          updateOptions.due_datetime = selectedDateTime.toISOString();
          break;
      }

      let success = await todoist.updateTask(task.id, updateOptions);
      if (success) {
        log(`Updated due date for "${task.content}"`);
        return true;
      } else {
        log(
          `Failed to update due date for "${task.content}" - ${todoist.lastError}`,
          true
        );
        return false;
      }
    } catch (error) {
      log(`Error updating due date: ${error}`, true);
      return false;
    }
  }

  async function handleAdjustDeadline(task: any): Promise<boolean> {
    let datePrompt = new Prompt();
    datePrompt.title = "Adjust Deadline";
    datePrompt.message = `Current deadline: ${task.deadline.date}\nSelect new deadline:`;

    datePrompt.addButton("Tomorrow");
    datePrompt.addButton("Next Week");
    datePrompt.addButton("Custom Date");

    if (!datePrompt.show()) return false;

    try {
      let newDeadline: string | undefined;
      switch (datePrompt.buttonPressed) {
        case "Tomorrow":
          let tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          newDeadline = tomorrow.toISOString().split("T")[0];
          break;
        case "Next Week":
          let nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          newDeadline = nextWeek.toISOString().split("T")[0];
          break;
        case "Custom Date":
          let customPrompt = new Prompt();
          customPrompt.addDatePicker(
            "newDeadline",
            "Select New Deadline",
            new Date(),
            { mode: "date" }
          );

          if (!customPrompt.show()) return false;

          let selectedDate: Date = customPrompt.fieldValues["newDeadline"];
          newDeadline = selectedDate.toISOString().split("T")[0];
          break;
      }

      let updateOptions: any = {
        content: task.content,
        deadline: {
          date: newDeadline,
          lang: "en",
        },
      };

      let success = await todoist.updateTask(task.id, updateOptions);
      if (success) {
        log(`Updated deadline for "${task.content}" to ${newDeadline}`);
        return true;
      } else {
        log(
          `Failed to update deadline for "${task.content}" - ${todoist.lastError}`,
          true
        );
        return false;
      }
    } catch (error) {
      log(`Error adjusting deadline: ${error}`, true);
      return false;
    }
  }

  async function handleRemoveDeadline(task: any): Promise<boolean> {
    try {
      let updateOptions: any = {
        content: task.content,
        deadline: null,
      };

      let success = await todoist.updateTask(task.id, updateOptions);
      if (success) {
        log(`Removed deadline from "${task.content}"`);
        return true;
      } else {
        log(
          `Failed to remove deadline from "${task.content}" - ${todoist.lastError}`,
          true
        );
        return false;
      }
    } catch (error) {
      log(`Error removing deadline: ${error}`, true);
      return false;
    }
  }

  async function handleAssignDuration(tasks: TodoistTask[]) {
    if (tasks.length === 0) {
      showAlert("No Tasks", "No tasks found without a duration.");
      log("No tasks to assign duration.");
      return;
    }

    log(`Starting to assign durations for ${tasks.length} tasks.`);
    let remainingTasks = [...tasks];

    while (remainingTasks.length > 0) {
      let selectedTask = showTaskSelectionPrompt(remainingTasks);
      if (!selectedTask) {
        log("User cancelled the task selection prompt.");
        break;
      }

      log(`User selected task: "${selectedTask.content}"`);
      let assignSuccess = await assignDurationToTask(selectedTask);
      if (assignSuccess) {
        log(`Successfully assigned duration to "${selectedTask.content}"`);
      } else {
        log(`Failed to assign duration to "${selectedTask.content}"`, true);
      }

      // remove from the array either way
      remainingTasks = remainingTasks.filter((t) => t.id !== selectedTask.id);
    }

    log("Completed assigning durations.");
    showAlert("Completed", "Finished assigning durations.");
  }

  function showTaskSelectionPrompt(tasks: TodoistTask[]): TodoistTask | null {
    log("Displaying task selection prompt...");
    let p = new Prompt();
    p.title = "Assign Duration";
    p.message = "Select a task to assign a duration:";

    let taskOptions = tasks.map((t) => `${t.content} (ID: ${t.id})`);
    p.addPicker("task", "Tasks", [taskOptions], [0]);
    p.addButton("Select");
    p.addButton("Cancel");

    if (p.show() && p.buttonPressed === "Select") {
      let selectedIndex = p.fieldValues["task"][0];
      let selectedTaskLabel = taskOptions[selectedIndex];

      log(`Selected Task Label: "${selectedTaskLabel}"`);
      log(`Selected Index: ${selectedIndex}`);

      if (typeof selectedTaskLabel === "string") {
        let idMatch = selectedTaskLabel.match(/\(ID:\s*(\d+)\)$/);
        if (idMatch) {
          let taskId = idMatch[1];
          let selectedTask = tasks.find((t) => t.id.toString() === taskId);
          if (selectedTask) {
            log(
              `Task selected: "${selectedTask.content}" with ID ${selectedTask.id}`
            );
            return selectedTask;
          } else {
            log(`Task ID "${taskId}" not found in tasks array.`, true);
            return null;
          }
        } else {
          log(`Could not extract ID from label: "${selectedTaskLabel}"`, true);
          return null;
        }
      } else {
        log(`Invalid selection type: ${typeof selectedTaskLabel}`, true);
        return null;
      }
    }

    log("User cancelled or closed the task selection prompt.");
    return null;
  }

  async function assignDurationToTask(task: TodoistTask): Promise<boolean> {
    log(`Assigning duration to task: "${task.content}"`);

    let durationPrompt = new Prompt();
    durationPrompt.title = "Assign Duration";
    durationPrompt.message = `Assign a duration for:\n"${task.content}"`;

    const durations = [
      "15 minutes",
      "30 minutes",
      "1 hour",
      "2 hours",
      "Custom",
    ];
    durations.forEach((d) => durationPrompt.addButton(d));
    durationPrompt.addButton("Skip");

    if (!durationPrompt.show()) {
      log(`User skipped assigning duration for "${task.content}"`);
      return false;
    }

    if (durations.includes(durationPrompt.buttonPressed)) {
      let selectedDuration = durationPrompt.buttonPressed;
      log(`User selected duration: ${selectedDuration}`);

      if (selectedDuration !== "Custom") {
        let [amount, unitText] = selectedDuration.split(" ");
        let durationAmount = parseInt(amount);

        if (unitText.startsWith("hour")) {
          durationAmount = durationAmount * 60;
        }

        let durationUpdate: any = {
          content: task.content,
          duration: durationAmount,
          duration_unit: "minute",
        };

        let durationSuccess = await todoist.updateTask(task.id, durationUpdate);
        if (durationSuccess) {
          log(
            `Assigned duration: ${durationAmount} minutes to "${task.content}"`
          );
          return true;
        } else {
          log(
            `Failed to assign duration to "${task.content}" - ${todoist.lastError}`,
            true
          );
          return false;
        }
      } else {
        let customDurationPrompt = new Prompt();
        customDurationPrompt.title = "Custom Duration";
        customDurationPrompt.message = `Enter a custom duration for:\n"${task.content}"`;
        customDurationPrompt.addTextField(
          "customDuration",
          "Duration (e.g., 45 minutes)",
          ""
        );
        customDurationPrompt.addButton("Save");
        customDurationPrompt.addButton("Cancel");

        if (customDurationPrompt.show()) {
          if (customDurationPrompt.buttonPressed === "Save") {
            let customDurationInput =
              customDurationPrompt.fieldValues["customDuration"];
            log(`User entered custom duration: ${customDurationInput}`);

            let customMatch = customDurationInput.match(
              /(\d+)\s*(minute|minutes|hour|hours|day|days)/i
            );
            if (customMatch) {
              let amount = parseInt(customMatch[1]);
              let unitInput = customMatch[2].toLowerCase();

              if (unitInput.startsWith("hour")) {
                amount = amount * 60;
              }

              let customDurationUpdate: any = {
                content: task.content,
                duration: amount,
                duration_unit: "minute",
              };

              let customDurationSuccess = await todoist.updateTask(
                task.id,
                customDurationUpdate
              );
              if (customDurationSuccess) {
                log(
                  `Assigned custom duration: ${amount} minutes to "${task.content}"`
                );
                return true;
              } else {
                log(
                  `Failed to assign custom duration to "${task.content}" - ${todoist.lastError}`,
                  true
                );
                return false;
              }
            } else {
              log(
                `Invalid custom duration format: "${customDurationInput}"`,
                true
              );
              showAlert(
                "Invalid Duration",
                "Please enter the duration like '45 minutes' or '2 hours'."
              );
              return false;
            }
          }
        }
      }
    }

    return false;
  }
}

