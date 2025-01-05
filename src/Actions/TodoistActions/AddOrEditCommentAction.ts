import { cancelAction, failAction } from "../../helpers/CommonFlowUtils";

declare var app: App;

export async function runAddOrEditComment(
  todoist: Todoist,
  taskId: string,
  selectedText: string
): Promise<void> {
  try {
    console.log("Adding or editing comment for Todoist task...");

    const comments = todoist.getComments({ task_id: taskId });

    const options: string[] = ["Create New Comment"];
    const commentMap: { [key: string]: any } = {};

    comments.forEach((comment: any, index: number) => {
      const snippet = comment.content.substring(0, 30).replace(/\r?\n|\r/g, " ");
      const option = `Edit Comment ${index + 1}: ${snippet}...`;
      options.push(option);
      commentMap[option] = comment;
    });

    const actionPrompt = new Prompt();
    actionPrompt.title = "Todoist Comments";
    actionPrompt.message = "Choose an option:";
    options.forEach((option) => actionPrompt.addButton(option));
    actionPrompt.addButton("Cancel");

    const actionResult = actionPrompt.show();
    if (!actionResult || actionPrompt.buttonPressed === "Cancel") {
      console.log("User cancelled comment input.");
      cancelAction("User cancelled the action");
      return;
    }

    const selectedOption = actionPrompt.buttonPressed;
    let commentText = "";
    let commentId: string | null = null;

    if (selectedOption !== "Create New Comment") {
      const comment = commentMap[selectedOption];
      commentId = comment.id;
      commentText = comment.content;
    }

    const commentPrompt = new Prompt();
    commentPrompt.title = commentId ? "Edit Comment" : "Add Comment";
    commentPrompt.message = "Enter your comment:";
    commentPrompt.addTextView("comment", "Comment", commentText || selectedText, {
      height: 100,
    });
    commentPrompt.addButton("Submit");
    commentPrompt.addButton("Cancel");

    const commentResult = commentPrompt.show();
    if (!commentResult || commentPrompt.buttonPressed === "Cancel") {
      console.log("User cancelled comment input.");
      cancelAction("User cancelled the action");
      return;
    }

    commentText = commentPrompt.fieldValues["comment"];

    if (commentId) {
      // Editing existing
      const result = todoist.updateComment(commentId, {
        content: commentText,
      });

      if (result && result.id) {
        app.displaySuccessMessage("Comment updated on Todoist task.");
        console.log("Comment updated on Todoist task.");
      } else {
        console.error(
          "Failed to update comment on Todoist task:",
          result,
          todoist.lastError
        );
        app.displayErrorMessage("Failed to update comment on Todoist task.");
        failAction("An unexpected error occurred during execution");
      }
    } else {
      // Creating new
      const result = todoist.createComment({
        task_id: taskId,
        content: commentText,
      });

      if (result && result.id) {
        app.displaySuccessMessage("Comment added to Todoist task.");
        console.log("Comment added to Todoist task.");
      } else {
        console.error(
          "Failed to add comment to Todoist task:",
          result,
          todoist.lastError
        );
        app.displayErrorMessage("Failed to add comment to Todoist task.");
        failAction("Failed to fetch issue details from Jira.");
      }
    }
  } catch (error) {
    console.error("Error in runAddOrEditComment:", error);
    app.displayErrorMessage("An error occurred while processing comment.");
    failAction("Failed to fetch GitHub item details");
  }
}