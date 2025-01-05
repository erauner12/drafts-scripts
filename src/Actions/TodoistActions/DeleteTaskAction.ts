import { failAction, quickAlert } from "../../helpers/CommonFlowUtils";

declare var app: App;

export function runDeleteTask(todoist: Todoist, taskId: string): boolean {
  try {
    console.log("Deleting Todoist task...");
    const response = todoist.request({
      method: "DELETE",
      url: `https://api.todoist.com/rest/v2/tasks/${taskId}`,
    });

    if (response.success) {
      app.displaySuccessMessage("Task deleted successfully.");
      return true;
    } else {
      console.error("Failed to delete task:", response);
      app.displayErrorMessage("Failed to delete task.");
      failAction("Failed to delete task. Possibly no success property from API?");
      return false;
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    quickAlert("Failed to delete task.", String(error), true);
    return false;
  }
}
