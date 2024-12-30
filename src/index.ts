export {
  copyLineDown,
  copyLineToClipboard,
  copyLineUp,
  cutLine,
  deleteLine,
} from "./actions-editing-copycutdelete";

export {
  selectAll,
  selectLine,
  selectParagraph,
  selectResponse,
} from "./actions-editing-selection";

export { insertDictation, pasteClipboard } from "./actions-editing-utils";

export {
  jumpToNextHeader,
  jumpToPreviousHeader,
  moveCursorLeft,
  moveCursorRight,
} from "./actions-navigation";

export {
  highlightBold,
  highlightCode,
  highlightCodeBlock,
  highlightItalic,
} from "./actions-markdown-highlighting";

export {
  insertMarkdownImage,
  insertMarkdownLink,
} from "./actions-markdown-links";

export { linebreakKeepIndentation as linebreakWithinList } from "./actions-markdown-lists";

export {
  toggleMarkdownCheckboxes,
  toggleMarkdownTasks,
} from "./actions-markdown-tasks";

export {
  capitalize,
  removeExtraWhitespace,
  removeWhitespace,
  replaceWhitespace,
  sortLines,
  toCamelCase,
  toHyphenCase,
  toLowerCaseCustom,
  toMemeCase,
  toPascalCase,
  toSnakeCase,
  toTitleCase,
  toUpperCaseCustom,
  trimWhitespace,
} from "./actions-transform-case";

export {
  evaluateMathExpression,
  max,
  mean,
  min,
  product,
  sum,
} from "./actions-transform-math";

export { copyAllTagsToClipboard } from "./actions-shortcuts";



export { runTodoistEnhancedMenu } from "./Actions/TaskActions/TodoistEnhancedMenu";

// New flexible flow approach
export {
  executeSelectedTasksStep,
  selectTasksStep,
} from "./Actions/TaskActions/TodoistFlexibleFlow";


/**
 * Re-export date/time prompt utility functions:
 *
 * pickTimeForToday():
 *   Prompts the user to select a time (morning, noon, evening, or custom) and returns
 *   a string describing how the task should be scheduled for today (e.g., "today at 9am").
 *
 * pickFutureDate():
 *   Prompts the user to select a date in the future (or tomorrow, next week, etc.)
 *   and returns an object containing either { due_string: string } or { due_date: string },
 *   depending on the user selection.
 */
export {
  pickFutureDate,
  pickTimeForToday,
} from "./Actions/TaskActions/DateTimePrompts";

export { runDailyDriverMenu } from "./Actions/TaskActions/DailyDriverMenu";

// Executor for JSON-based ephemeral drafts
export { runDraftsActionExecutor } from "./Actions/DraftActionExecutor";