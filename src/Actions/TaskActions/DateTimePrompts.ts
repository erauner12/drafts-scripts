/**
 * DateTimePrompts.ts
 *
 * This file provides smaller, focused functions for choosing times and future dates,
 * reducing the responsibilities of the main TaskMenus or other scripts.
 */

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
  show(): boolean;
}

/**
 * Presents a prompt to choose a time for today and returns the appropriate
 * due_string value (e.g., "today at 9am" or "today") based on user selection.
 * @returns {string|null} - A string representing the chosen time, or null if user cancelled.
 */
export function pickTimeForToday(): string | null {
  let timePrompt = new Prompt();
  timePrompt.title = "Set Time for Today";
  timePrompt.message = "How should this task be scheduled for today?";

  timePrompt.addButton("Early Morning (7 AM)");
  timePrompt.addButton("Late Morning (10:30 AM)");
  timePrompt.addButton("Afternoon (3 PM)");
  timePrompt.addButton("Evening (8 PM)");
  timePrompt.addButton("Morning (9 AM)");
  timePrompt.addButton("Noon (12 PM)");
  timePrompt.addButton("No Specific Time");
  timePrompt.addButton("Custom Time");

  if (!timePrompt.show()) return null;

  switch (timePrompt.buttonPressed) {
    case "Early Morning (7 AM)":
      return "today at 7am";
    case "Late Morning (10:30 AM)":
      return "today at 10:30am";
    case "Afternoon (3 PM)":
      return "today at 3pm";
    case "Evening (8 PM)":
      return "today at 8pm";
    case "Morning (9 AM)":
      return "today at 9am";
    case "Noon (12 PM)":
      return "today at 12pm";
    case "No Specific Time":
      return "today";
    case "Custom Time": {
      let customPrompt = new Prompt();
      customPrompt.addDatePicker("time", "Select Time", new Date(), {
        mode: "time",
      });
      if (customPrompt.show()) {
        let selectedTime: Date = customPrompt.fieldValues["time"];
        let hours = selectedTime.getHours().toString().padStart(2, "0");
        let minutes = selectedTime.getMinutes().toString().padStart(2, "0");
        return `today at ${hours}:${minutes}`;
      } else {
        return null;
      }
    }
    default:
      return null;
  }
}

/**
 * Presents a prompt to choose a future date and returns an object containing
 * either a due_string or a due_date property, depending on the user selection.
 * @returns {object|null} - An object with { due_string: string } or { due_date: string }, or null if user cancelled.
 */
export function pickFutureDate(): { [key: string]: string } | null {
  let datePrompt = new Prompt();
  datePrompt.title = "Move to Future Date";
  datePrompt.message = "When should this task be due?";

  datePrompt.addButton("In Two Days");
  datePrompt.addButton("In Three Days");
  datePrompt.addButton("In One Week");
  datePrompt.addButton("In Two Weeks");
  datePrompt.addButton("Tomorrow");
  datePrompt.addButton("Next Week");
  datePrompt.addButton("Custom Date");

  if (!datePrompt.show()) return null;

  switch (datePrompt.buttonPressed) {
    case "In Two Days": {
      let twoDays = new Date();
      twoDays.setDate(twoDays.getDate() + 2);
      return { due_date: twoDays.toISOString().split("T")[0] };
    }
    case "In Three Days": {
      let threeDays = new Date();
      threeDays.setDate(threeDays.getDate() + 3);
      return { due_date: threeDays.toISOString().split("T")[0] };
    }
    case "In One Week": {
      let oneWeek = new Date();
      oneWeek.setDate(oneWeek.getDate() + 7);
      return { due_date: oneWeek.toISOString().split("T")[0] };
    }
    case "In Two Weeks": {
      let twoWeeks = new Date();
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      return { due_date: twoWeeks.toISOString().split("T")[0] };
    }
    case "Tomorrow":
      return { due_string: "tomorrow" };
    case "Next Week":
      return { due_string: "next monday" };
    case "Custom Date": {
      let customPrompt = new Prompt();
      customPrompt.addDatePicker("date", "Select Date", new Date(), {
        mode: "date",
      });
      if (customPrompt.show()) {
        let selectedDate: Date = customPrompt.fieldValues["date"];
        return { due_date: selectedDate.toISOString().split("T")[0] };
      } else {
        return null;
      }
    }
    default:
      return null;
  }
}
