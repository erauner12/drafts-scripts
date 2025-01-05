import { failAction } from "../../helpers/CommonFlowUtils";
import { runExportToNewDraft } from "./ExportToNewDraftAction";
import { runDeleteTask } from "./DeleteTaskAction";

export async function runExportAndDelete(
  todoist: Todoist,
  taskId: string
): Promise<boolean> {
  try {
    const exported = await runExportToNewDraft(todoist, taskId);
    if (exported) {
      const deleted = runDeleteTask(todoist, taskId);
      if (deleted) {
        app.displaySuccessMessage("Task exported and deleted successfully.");
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error in exportAndDelete:", error);
    failAction("Failed to export and delete task.", error);
    return false;
  }
}