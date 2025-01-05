import { failAction, cancelAction } from "../../helpers/CommonFlowUtils";

declare var app: App;

export function runOpenInBrowser(taskId: string) {
  const taskUrl = "https://todoist.com/showTask?id=" + taskId;
  app.openURL(taskUrl);
  app.displaySuccessMessage("Opened Todoist task in browser.");
}