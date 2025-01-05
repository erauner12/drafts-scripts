import { runTOTIntegration } from "../TOTIntegration/TOTIntegration";
import { SourceItem } from "./SourceItem";

/**
 * ActionItem interface
 * Each action item has:
 *  - label: A string to display in a prompt
 *  - run:   A function that handles the actual logic
 *    (Optionally pass the SourceItem or draft, or no arguments if not needed)
 */
export interface ActionItem {
  label: string;
  run: (sourceItem: SourceItem) => void | Promise<void>;
}

/**
 * runTOTIntegrationAction
 * Simple wrapper to call TOTIntegration from the SourceActionRegistry items.
 */
function runTOTIntegrationAction(_item: SourceItem) {
  console.log("[SourceActionRegistry] Running TOT Integration now...");
  runTOTIntegration();
}

/**
 * Sample universal or fallback actions:
 * They might do something generic like "No Specific Source Found" or other utilities.
 */
function runNoSourceFound(_item: SourceItem) {
  console.log("[Fallback Action] No specific source found for this item.");
  app.displayInfoMessage("No specific source found. Running fallback action.");
}

// Example fallback action #2
function runGenericAction(_item: SourceItem) {
  console.log("[Fallback Action] Some generic fallback behavior.");
  app.displayInfoMessage("Doing something generic for any draft/source.");
}

// For demonstration, define fallback actions in an array:
export const fallbackActions: ActionItem[] = [
  {
    label: "No Specific Source Found",
    run: runNoSourceFound,
  },
  {
    label: "Generic Fallback Action",
    run: runGenericAction,
  },
  {
    label: "Manage TOT",
    run: runTOTIntegrationAction,
  },
];

/**
 * Create specialized action sets for recognized source types.
 * Example: todoist might have specialized logic,
 * or we reuse existing "TodoistTask" subactions.
 */
function runOpenInBrowserForTodoist(item: SourceItem) {
  console.log("[Todoist Action] Running open in browser for a todoist item...");
  // We can cast item to TodoistTask if needed, or call item methods:
  // (item as TodoistTask).someMethod();
  item.appendAIResultToDraft(
    "Pretend we do something here for browser open..."
  );
}

function runExportAllForTodoist(item: SourceItem) {
  console.log("[Todoist Action] Exporting info from a todoist item...");
  item.appendAIResultToDraft("Pretend we do a full export of the item...");
}

// Example minimal JIRA actions
function runOpenInBrowserForJira(item: SourceItem) {
  console.log("[JIRA Action] Opening a JIRA issue in browser...");
  item.appendAIResultToDraft("Pretend we do JIRA stuff here...");
}

/**
 * SourceActionRegistry
 * Maps each sourceType string (like "todoist", "jira", "github") to an array of ActionItems.
 * If no source type is recognized (or the array is empty), use fallbackActions.
 */
export const SourceActionRegistry: Record<string, ActionItem[]> = {
  // For example, a "todoist" source could have these two specialized actions:
  todoist: [
    {
      label: "Open in Browser (Todoist)",
      run: runOpenInBrowserForTodoist,
    },
    {
      label: "Export All (Todoist)",
      run: runExportAllForTodoist,
    },
    {
      label: "Manage TOT",
      run: runTOTIntegrationAction,
    },
  ],

  jira: [
    {
      label: "Open in Browser (JIRA)",
      run: runOpenInBrowserForJira,
    },
    // Add more if desired...
  ],

  // Could add "github" or others similarly. For example:
  // github: [...],

  // The fallback property is not mandatory in a Record<string,ActionItem[]>,
  // but we define it here for convenience. Alternatively, you can store "fallback"
  // externally. Either approach is valid.
  fallback: fallbackActions,
};
