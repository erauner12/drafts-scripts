import { log } from "../helpers-utils";

/**
 * We'll assume "draft", "editor", "app", and "script" are globally available, as in Drafts.
 */
declare var draft: {
  uuid: string;
  content: string;
  isTrashed: boolean;
  isArchived: boolean;
  isFlagged: boolean;
  title: string;
  update(): void;
};

declare var editor: {
  load(d: any): void;
};

declare var app: {
  currentWorkspace: {
    query(filter: string): any[];
  };
  displayInfoMessage(message: string): void;
};

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
    options?: { mode?: string; minimumDate?: Date }
  ): void;
  show(): boolean;
}

/**
 * runManageDraftWithPrompt
 *
 * Integrates an older script that manages the current draft in context.
 * This script loads a draft into the editor, prompts the user for actions
 * (like “Delete”, “Archive”, “Move to Inbox”, etc.), optionally sets or updates
 * a tickler date, and moves to the next relevant draft in the workspace.
 *
 * Usage:
 *  1) Put this file in your /src/Actions folder.
 *  2) Re-export runManageDraftWithPrompt() from your src/index if desired.
 *  3) In a Drafts script step, call:
 *     require("custom-scripts/drafts-actions.js");
 *     runManageDraftWithPrompt();
 */
export async function runManageDraftWithPrompt(): Promise<void> {
  if (!draft) {
    log("No draft available!");
    return;
  }

  let d = draft;

  function getTicklerDate(content: string): string | null {
    const match = content.match(/\[tickler:(\d{4}-\d{2}-\d{2})\]/);
    return match ? match[1] : null;
  }

  function isTicklerOverdue(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const ticklerDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ticklerDate < today;
  }

  function getRelativeDateInfo(dateStr: string | null): string | null {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    let relativeText = "";
    if (days === 0) {
      relativeText = "today";
    } else if (days === 1) {
      relativeText = "tomorrow";
    } else if (days === -1) {
      relativeText = "yesterday";
    } else if (days < -1) {
      relativeText = days + " days ago";
    } else if (days < 7) {
      relativeText = "in " + days + " days";
    } else if (days < 14) {
      relativeText = "next week";
    } else {
      relativeText = "in " + days + " days";
    }

    return dateStr + " (" + dayNames[date.getDay()] + ", " + relativeText + ")";
  }

  function isTicklerDueToday(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const ticklerDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ticklerDate.getTime() === today.getTime();
  }

  function getDefaultAction(): string {
    const ticklerDate = getTicklerDate(d.content);
    const isOverdue = isTicklerOverdue(ticklerDate);
    const isDueToday = isTicklerDueToday(ticklerDate);

    if (d.isTrashed || d.isArchived) {
      return "Move to Inbox";
    } else if (isOverdue || isDueToday) {
      return "Archive";
    } else if (ticklerDate) {
      return "Archive";
    } else {
      return "Delete";
    }
  }

  function getCurrentState() {
    return {
      isArchived: d.isArchived,
      isTrashed: d.isTrashed,
      isFlagged: d.isFlagged,
      ticklerDate: getTicklerDate(d.content),
    };
  }

  function getAvailableActions() {
    const state = getCurrentState();
    const primaryActions = new Set<string>();
    const utilityActions = new Set<string>();

    // Add primary actions based on current state
    if (!state.isTrashed && !state.isArchived) {
      primaryActions.add("Archive");
      primaryActions.add("Delete");
    }
    if (state.isArchived || state.isTrashed) {
      primaryActions.add("Move to Inbox");
    }

    // Always available utility actions
    utilityActions.add("Flag/Unflag");
    utilityActions.add("Set Tickler");
    utilityActions.add("Cancel");

    return {
      primary: Array.from(primaryActions),
      utility: Array.from(utilityActions),
    };
  }

  async function promptForTicklerDate(isArchiving = false): Promise<boolean> {
    let p = new Prompt();
    p.title = isArchiving ? "When to return to inbox?" : "Select Tickler Date";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime());
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today.getTime());
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date(today.getTime());
    nextMonth.setMonth(today.getMonth() + 1);

    p.addButton("Today");
    p.addButton("Tomorrow");
    p.addButton("Next Week");
    p.addButton("Next Month");
    p.addButton("Custom Date");
    if (!isArchiving) {
      p.addButton("Cancel");
    }

    let result = p.show();
    let selectedDate: Date | null = null;

    if (!result && isArchiving) {
      return await promptForTicklerDate(true);
    } else if (!result) {
      return false;
    }

    switch (p.buttonPressed) {
      case "Today":
        selectedDate = today;
        break;
      case "Tomorrow":
        selectedDate = tomorrow;
        break;
      case "Next Week":
        selectedDate = nextWeek;
        break;
      case "Next Month":
        selectedDate = nextMonth;
        break;
      case "Custom Date":
        let datePrompt = new Prompt();
        datePrompt.title = "Select Custom Date";
        datePrompt.addDatePicker("ticklerDate", "", new Date(), {
          mode: "date",
          minimumDate: today,
        });
        datePrompt.addButton("Set Date");
        if (!isArchiving) {
          datePrompt.addButton("Cancel");
        }

        if (datePrompt.show()) {
          selectedDate = datePrompt.fieldValues["ticklerDate"];
        } else if (isArchiving) {
          return await promptForTicklerDate(true);
        } else {
          return false;
        }
        break;
      case "Cancel":
        return false;
    }

    if (selectedDate) {
      let formattedDate = selectedDate.toISOString().split("T")[0];
      let ticklerString = "\n\n[tickler:" + formattedDate + "]";

      let content = d.content.replace(/\n\n\[tickler:[^\]]+\]/, "");
      d.content = content + ticklerString;
      d.update();
      log("Tickler set for: " + formattedDate);
      return true;
    }
    return false;
  }

  async function confirmArchiveWithWarning(message: string): Promise<string> {
    let p = new Prompt();
    p.title = "Archive Confirmation";
    p.message = message;
    p.addButton("Update Tickler");
    p.addButton("Archive Anyway");
    p.addButton("Cancel");

    const result = p.show();
    if (!result || p.buttonPressed === "Cancel") {
      return "cancel";
    }
    return p.buttonPressed;
  }

  async function ensureTicklerDateAndArchive(): Promise<boolean> {
    const currentState = getCurrentState();
    if (currentState.isArchived) {
      app.displayInfoMessage("Draft is already archived.");
      return false;
    }

    const currentTickler = getTicklerDate(d.content);
    if (!currentTickler) {
      const ticklerSet = await promptForTicklerDate(true);
      if (!ticklerSet) {
        return false;
      }
      d.update();
    } else {
      const isOverdue = isTicklerOverdue(currentTickler);
      const isDueToday = isTicklerDueToday(currentTickler);

      if (isOverdue || isDueToday) {
        let warningMessage = isOverdue
          ? "This draft has an overdue tickler date."
          : "This draft is due for review today.";
        warningMessage +=
          "\nWould you like to update the tickler date before archiving?";

        const decision = await confirmArchiveWithWarning(warningMessage);
        if (decision === "cancel") {
          return false;
        } else if (decision === "Update Tickler") {
          const ticklerUpdated = await promptForTicklerDate(true);
          if (!ticklerUpdated) {
            return false;
          }
          d.update();
        }
      }
    }

    d.isArchived = true;
    d.update();
    return true;
  }

  async function moveToInbox(): Promise<boolean> {
    const currentState = getCurrentState();
    if (!currentState.isArchived && !currentState.isTrashed) {
      app.displayInfoMessage("Draft is already in inbox.");
      return false;
    }

    d.isArchived = false;
    d.isTrashed = false;
    d.update();
    return true;
  }

  while (true) {
    log("Managing draft: " + d.title);

    let currentTickler = getTicklerDate(d.content);
    let ticklerInfo = getRelativeDateInfo(currentTickler);
    const isOverdue = isTicklerOverdue(currentTickler);

    let p = new Prompt();
    p.title = "Manage Draft";

    let status =
      '"' +
      d.title +
      '"\n\nCurrent Status:\n• Location: ' +
      (d.isArchived ? "Archive" : d.isTrashed ? "Trash" : "Inbox") +
      "\n• " +
      (d.isFlagged ? "🏳️ Flagged" : "⚪ Not Flagged") +
      "\n• Tickler: " +
      (ticklerInfo ? ticklerInfo : "None");

    if (isOverdue && currentTickler) {
      status += "\n\n⚠️ Tickler date is overdue!";
    }

    p.message = status;

    const defaultAction = getDefaultAction();
    const { primary, utility } = getAvailableActions();

    // Add default action first if it's a primary action
    if (primary.includes(defaultAction)) {
      p.addButton(defaultAction);
    }

    // Add remaining primary actions
    primary
      .filter((action) => action !== defaultAction)
      .forEach((action) => p.addButton(action));

    // Add utility actions
    utility.forEach((action) => p.addButton(action));

    if (!p.show()) {
      log("Prompt cancelled");
      return;
    }

    log("Button pressed: " + p.buttonPressed);

    switch (p.buttonPressed) {
      case "Cancel":
        script.complete();
        return;

      case "Flag/Unflag":
        d.isFlagged = !d.isFlagged;
        d.update();
        continue;

      case "Set Tickler":
        await promptForTicklerDate();
        continue;

      case "Move to Inbox": {
        const moved = await moveToInbox();
        if (moved) {
          script.complete();
          return;
        }
        continue;
      }

      case "Delete":
      case "Archive": {
        const currentWorkspace = app.currentWorkspace;
        let workspaceDrafts = currentWorkspace.query("all");
        let currentIndex = workspaceDrafts.findIndex(
          (dr) => dr.uuid === d.uuid
        );
        let nextDraft = null;

        for (let i = currentIndex + 1; i < workspaceDrafts.length; i++) {
          if (!workspaceDrafts[i].isTrashed && !workspaceDrafts[i].isArchived) {
            nextDraft = workspaceDrafts[i];
            break;
          }
        }

        if (!nextDraft) {
          for (let i = currentIndex - 1; i >= 0; i--) {
            if (
              !workspaceDrafts[i].isTrashed &&
              !workspaceDrafts[i].isArchived
            ) {
              nextDraft = workspaceDrafts[i];
              break;
            }
          }
        }

        if (p.buttonPressed === "Delete") {
          d.isTrashed = true;
          d.update();
        } else {
          const archived = await ensureTicklerDateAndArchive();
          if (!archived) {
            continue;
          }
        }

        if (nextDraft) {
          editor.load(nextDraft);
        }
        script.complete();
        return;
      }
    }
  }
}
