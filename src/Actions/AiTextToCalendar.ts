import { copyToClipboard, log, showAlert } from "../helpers-utils";

/**
 * We define a TypeScript interface to mirror the desired JSON output from OpenAI.
 */
interface CalendarEvent {
  title: string;
  start_date: string; // YYYYMMDD
  start_time: string; // hhmmss
  end_date: string; // YYYYMMDD
  end_time: string; // hhmmss
  details: string;
  location: string;
}

declare const draft: Draft;
declare const editor: {
  getSelectedText(): string;
};
declare const app: {
  openURL(url: string): boolean;
};
declare class OpenAI {
  static create(apiKey?: string, host?: string): OpenAI;
  model: string;
  quickChatResponse(prompt: string, options?: object): string;
}

/**
 * runAiTextToCalendar
 *
 * This Drafts action function reads the current draft content (or selection),
 * passes it to an OpenAI Chat model, attempts to parse the returned JSON for
 * Calendar event details, and if successful, builds a Google Calendar link,
 * copies it to the clipboard, and opens it in the browser.
 *
 * Usage:
 *   1) Edit or select text in a draft that describes an event (date, time, details).
 *   2) Run this action, which queries OpenAI to parse that text into an event.
 *   3) A URL is built for Google Calendar. The script copies the URL to your clipboard and
 *      opens it in the default browser to let you add it to your calendar.
 */
export async function runAiTextToCalendar() {
  try {
    // If the user has some text selected, use that. Otherwise, fallback to entire draft content.
    const selectedText = editor.getSelectedText()?.trim();
    const userText =
      selectedText && selectedText.length > 0
        ? selectedText
        : draft.content.trim();

    if (!userText) {
      showAlert("No Text", "Draft has no content or selection to parse.");
      return;
    }

    log("[AiTextToCalendar] Starting extraction with userText:\n" + userText);

    // Build the system message to guide the model.
    // The user specifically wants an output in JSON format and in "English" (or user’s chosen language).
    // You can adapt or localize as you wish.
    const systemMessage = `\
Extract schedule information from the text provided by the user.
The output should be in the following JSON format.

{
  "title": "string",         // Event title
  "start_date": "YYYYMMDD",  // Start date
  "start_time": "hhmmss",    // Start time
  "end_date": "YYYYMMDD",    // End date
  "end_time": "hhmmss",      // End time
  "details": "string",       // Summary in up to 3 concise sentences. URLs should be preserved.
  "location": "string"       // Event location
}

Note:
* Output in English
* Do not include any content other than the JSON format in the output
* If the organizer's name is known, include it in the title
* Ensure the location is easily identifiable
* If the end date/time are unknown, set them 2 hours after the start date/time
`;

    // 1) Create an OpenAI instance using Drafts credentials
    const ai = OpenAI.create();
    // By default, `OpenAI.create()` uses a credential named "OpenAI".
    // We could also set a model if desired:
    ai.model = "gpt-3.5-turbo";

    // 2) Build the user prompt. We'll do a single chat message with the user text.
    // We'll call `quickChatResponse` with a "system" style preamble concatenated,
    // or we can just manually craft a single request object. For convenience,
    // `quickChatResponse` expects a single prompt string. We'll embed the instructions
    // and user text together.
    const fullPrompt = `${systemMessage}\n\n${userText}`;

    // 3) Send the request. We expect a JSON string in response.
    // The user might want to handle errors or retries more robustly.
    log(
      "[AiTextToCalendar] Sending prompt to OpenAI. This may take a few seconds..."
    );
    const aiResponse = ai.quickChatResponse(fullPrompt, {
      temperature: 0.2,
      max_tokens: 256,
    });
    log("[AiTextToCalendar] Received raw response:\n" + aiResponse);

    // 4) Attempt to parse the JSON response into a CalendarEvent object
    let calendarEvent: CalendarEvent;
    try {
      calendarEvent = JSON.parse(aiResponse) as CalendarEvent;
    } catch (err) {
      showAlert(
        "Parsing Error",
        "Unable to parse AI response as valid JSON.\n\n" + String(err)
      );
      return;
    }

    // 5) Construct the Google Calendar URL
    const calendarUrl = toGoogleCalendarURL(calendarEvent);

    // 6) Copy URL to clipboard and open in default browser
    copyToClipboard(calendarUrl);
    app.openURL(calendarUrl);

    showAlert("Extracted!", "Calendar link opened & copied to clipboard.");
  } catch (error) {
    const errMsg = String(error);
    log("[AiTextToCalendar] Failure:\n" + errMsg, true);
    showAlert("Cannot transform text", errMsg);
  }
}

/**
 * Helper to build Google Calendar link from a CalendarEvent
 */
function toGoogleCalendarURL(event: CalendarEvent): string {
  // We'll just encode each part. Minimal encoding via encodeURIComponent:
  const textParam = encodeURIComponent(event.title);
  const datesParam = `${event.start_date}T${event.start_time}/${event.end_date}T${event.end_time}`;
  const detailsParam = encodeURIComponent(event.details);
  const locationParam = encodeURIComponent(event.location);

  // For reference:
  // https://calendar.google.com/calendar/render?action=TEMPLATE&text=Title&dates=20210101T160000/20210101T170000&details=Hello&location=New+York
  const url =
    `https://calendar.google.com/calendar/render` +
    `?action=TEMPLATE` +
    `&text=${textParam}` +
    `&dates=${datesParam}` +
    `&details=${detailsParam}` +
    `&location=${locationParam}` +
    `&trp=false`;

  return url;
}
