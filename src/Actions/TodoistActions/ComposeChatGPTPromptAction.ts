import { failAction } from "../../helpers/CommonFlowUtils";
import { runOpenChatGPTClipboard } from "./OpenChatGPTClipboardAction";

declare var app: App;
declare var device: Device;

export async function runComposeChatGPTPrompt(
  todoist: Todoist,
  taskId: string,
  selectedText: string
): Promise<void> {
  try {
    console.log("composeChatPrompt: Starting method...");

    let task: any;
    try {
      task = todoist.getTask(taskId);
      console.log("composeChatPrompt: Retrieved task:", JSON.stringify(task));
    } catch (innerErr) {
      console.error("composeChatPrompt: Could not retrieve task details:", innerErr);
    }

    const title = task && task.content ? task.content : "No Title";
    const description = task && task.description ? task.description : "";
    let comments: any[] = [];
    let lastComment = "";
    try {
      comments = todoist.getComments({ task_id: taskId }) || [];
      if (comments.length > 0) {
        lastComment = comments[comments.length - 1].content;
      }
    } catch (innerErr2) {
      console.error("composeChatPrompt: Could not retrieve comments:", innerErr2);
    }

    console.log("composeChatPrompt: title =", title);
    console.log("composeChatPrompt: description =", description);
    console.log("composeChatPrompt: lastComment =", lastComment);

    const contextPrompt = new Prompt();
    contextPrompt.title = "Select Task Context Details";
    contextPrompt.message =
      "Choose which parts of the task context you want to include when building your final ChatGPT content.";
    contextPrompt.addSwitch("includeTitle", "Include Title", true);
    contextPrompt.addSwitch("includeDesc", "Include Description", true);
    contextPrompt.addSwitch("includeLast", "Include Last Comment", true);
    contextPrompt.addSwitch("includeAllComments", "Include ALL Comments", false);
    contextPrompt.addButton("OK", undefined, true);
    contextPrompt.addButton("Cancel");

    const didContextShow = contextPrompt.show();
    if (!didContextShow || contextPrompt.buttonPressed === "Cancel") {
      console.log("User cancelled context selection. Exiting composeChatPrompt.");
      return;
    }

    const optTitle = contextPrompt.fieldValues["includeTitle"];
    const optDesc = contextPrompt.fieldValues["includeDesc"];
    const optLast = contextPrompt.fieldValues["includeLast"];
    const optAll = contextPrompt.fieldValues["includeAllComments"];

    console.log("composeChatPrompt: Context selection:", {
      optTitle,
      optDesc,
      optLast,
      optAll,
    });

    let userText = selectedText || "";
    console.log("composeChatPrompt: initial userText length =", userText.length);

    while (true) {
      console.log("composeChatPrompt: Displaying prompt for user text...");
      const prompt = new Prompt();
      prompt.title = "Compose ChatGPT Prompt";
      prompt.message = "Refine your text. Task details shown below.";

      prompt.addLabel("titleLabel", `**Task Title**: ${title}`, {
        textSize: "headline",
      });
      if (description.trim().length > 0) {
        prompt.addLabel("descLabel", `**Description**: ${description}`);
      }
      if (lastComment.trim().length > 0) {
        prompt.addLabel("commentLabel", `**Latest Comment**: ${lastComment}`);
      }

      prompt.addTextView("userPrompt", "Your Prompt", userText, {
        height: 120,
        wantsFocus: true,
      });

      prompt.addButton("Refine with AI");
      prompt.addButton("Open ChatGPT Now");
      prompt.addButton("OK", undefined, true);
      prompt.addButton("Cancel");

      const didShow = prompt.show();
      console.log(
        "composeChatPrompt: Prompt closed. buttonPressed =",
        prompt.buttonPressed
      );

      if (!didShow || prompt.buttonPressed === "Cancel") {
        console.log("User canceled Compose ChatGPT Prompt.");
        return;
      }

      userText = prompt.fieldValues["userPrompt"] || "";
      console.log("composeChatPrompt: Updated userText length =", userText.length);

      if (prompt.buttonPressed === "Refine with AI") {
        console.log("composeChatPrompt: User chose to refine with AI.");
        try {
          const ai = OpenAI.create();
          ai.model = "gpt-4o-mini";
          const refinePrompt = `Please refine the following text:\n\n"${userText}"`;
          const refined = await ai.quickChatResponse(refinePrompt);
          console.log(
            "composeChatPrompt: AI refine response received. length =",
            (refined || "").length
          );

          if (refined && refined.trim() !== "") {
            userText = refined.trim();
            console.log("composeChatPrompt: Updated userText after refinement.");
          } else {
            console.warn("No refined text returned by AI.");
            app.displayErrorMessage("No refined text returned.");
          }
        } catch (refineErr) {
          console.error("composeChatPrompt: Error during AI refinement:", refineErr);
          failAction("Error during AI refinement:", refineErr);
        }
      } else if (prompt.buttonPressed === "Open ChatGPT Now") {
        console.log(
          "composeChatPrompt: User chose to open ChatGPT with current refined text."
        );

        let contextLines: string[] = [];
        contextLines.push("Refined Prompt:\n" + userText);
        contextLines.push("\n---\n\nTask Context:\n");

        if (optTitle && title.trim().length > 0) {
          contextLines.push("Title: " + title);
        }
        if (optDesc && description.trim().length > 0) {
          contextLines.push("Description: " + description);
        }

        if (optAll) {
          let allCommentText = "";
          if (comments && comments.length > 0) {
            for (let c of comments) {
              allCommentText += "- " + c.content + "\n";
            }
          } else {
            allCommentText = "(No Comments)";
          }
          contextLines.push("All Comments:\n" + allCommentText.trim());
        } else if (optLast && lastComment.trim().length > 0) {
          contextLines.push("Last Comment: " + lastComment);
        }

        const combinedForClipboard = contextLines.join("\n");
        runOpenChatGPTClipboard(combinedForClipboard);
      } else if (prompt.buttonPressed === "OK") {
        console.log(
          "composeChatPrompt: User is satisfied with the prompt. Exiting loop."
        );
        break;
      }
    }

    let finalContextLines: string[] = [];
    finalContextLines.push(userText);
    finalContextLines.push("\n---\n\nTask Context:\n");

    if (optTitle && title.trim().length > 0) {
      finalContextLines.push("Task Title: " + title);
    }
    if (optDesc && description.trim().length > 0) {
      finalContextLines.push("Description: " + description);
    }

    if (optAll) {
      let allCommentText = "";
      if (comments && comments.length > 0) {
        for (let c of comments) {
          allCommentText += "- " + c.content + "\n";
        }
      } else {
        allCommentText = "(No Comments)";
      }
      finalContextLines.push("All Comments:\n" + allCommentText.trim());
    } else if (optLast && lastComment.trim().length > 0) {
      finalContextLines.push("Last Comment: " + lastComment);
    }

    const finalContent = finalContextLines.join("\n");
    console.log("composeChatPrompt: finalContent length =", finalContent.length);

    app.setClipboard(finalContent);
    app.displaySuccessMessage("Final prompt copied to clipboard.");

    console.log("composeChatPrompt: Opening ChatGPT without injection...");
    let chatGPTUrl =
      device.systemName === "iOS"
        ? "googlechrome://chat.openai.com/chat"
        : "https://chat.openai.com/chat";
    app.openURL(chatGPTUrl);
    console.log("ChatGPT opened in browser/scheme. Clipboard has final content.");
  } catch (err) {
    console.error("Error in composeChatPrompt:", err);
    failAction("Error during prompt composition.", err);
  }
}