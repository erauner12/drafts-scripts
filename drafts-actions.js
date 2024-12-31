var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/Actions/TaskActions/DateTimePrompts.ts
var exports_DateTimePrompts = {};
__export(exports_DateTimePrompts, {
  pickTimeForToday: () => pickTimeForToday,
  pickFutureDate: () => pickFutureDate
});
function pickTimeForToday() {
  let timePrompt = new Prompt;
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
  if (!timePrompt.show())
    return null;
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
      let customPrompt = new Prompt;
      customPrompt.addDatePicker("time", "Select Time", new Date, {
        mode: "time"
      });
      if (customPrompt.show()) {
        let selectedTime = customPrompt.fieldValues["time"];
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
function pickFutureDate() {
  let datePrompt = new Prompt;
  datePrompt.title = "Move to Future Date";
  datePrompt.message = "When should this task be due?";
  datePrompt.addButton("In Two Days");
  datePrompt.addButton("In Three Days");
  datePrompt.addButton("In One Week");
  datePrompt.addButton("In Two Weeks");
  datePrompt.addButton("Tomorrow");
  datePrompt.addButton("Next Week");
  datePrompt.addButton("Custom Date");
  if (!datePrompt.show())
    return null;
  switch (datePrompt.buttonPressed) {
    case "In Two Days": {
      let twoDays = new Date;
      twoDays.setDate(twoDays.getDate() + 2);
      return { due_date: twoDays.toISOString().split("T")[0] };
    }
    case "In Three Days": {
      let threeDays = new Date;
      threeDays.setDate(threeDays.getDate() + 3);
      return { due_date: threeDays.toISOString().split("T")[0] };
    }
    case "In One Week": {
      let oneWeek = new Date;
      oneWeek.setDate(oneWeek.getDate() + 7);
      return { due_date: oneWeek.toISOString().split("T")[0] };
    }
    case "In Two Weeks": {
      let twoWeeks = new Date;
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      return { due_date: twoWeeks.toISOString().split("T")[0] };
    }
    case "Tomorrow":
      return { due_string: "tomorrow" };
    case "Next Week":
      return { due_string: "next monday" };
    case "Custom Date": {
      let customPrompt = new Prompt;
      customPrompt.addDatePicker("date", "Select Date", new Date, {
        mode: "date"
      });
      if (customPrompt.show()) {
        let selectedDate = customPrompt.fieldValues["date"];
        return { due_date: selectedDate.toISOString().split("T")[0] };
      } else {
        return null;
      }
    }
    default:
      return null;
  }
}

// src/helpers-get-text.ts
var getDraftLength = () => {
  return draft.content.length;
};
var getSelectedText = () => {
  return editor.getSelectedText();
};
var getSelectedRange = () => {
  return editor.getSelectedRange();
};
var getSelectionStartIndex = () => {
  return getSelectedRange()[0];
};
var getCursorPosition = () => {
  return getSelectionStartIndex();
};
var isLastLine = (text) => {
  return !text.endsWith(`
`);
};
var isEndOfDraft = (positionIndex) => {
  return positionIndex === getDraftLength();
};
var getSelectionEndIndex = (selectionStartIndex, selectionLength) => {
  if (selectionStartIndex === undefined || selectionLength === undefined) {
    [selectionStartIndex, selectionLength] = getSelectedRange();
  }
  const selectionEndIndex = selectionStartIndex + selectionLength;
  if (isEndOfDraft(selectionEndIndex)) {
    return selectionEndIndex;
  }
  const textAfterSelection = getTextAfter(selectionEndIndex);
  if (textAfterSelection.trim() === "") {
    const selectedText = getTextfromRange(selectionStartIndex, selectionLength);
    const trimmedSelectedText = selectedText.trim();
    return selectionStartIndex + trimmedSelectedText.length;
  }
  return selectionEndIndex;
};
var getCurrentLineRange = () => {
  const [currentLineStartIndex, currentLineLength] = editor.getSelectedLineRange();
  const currentLineText = getTextfromRange(currentLineStartIndex, currentLineLength);
  if (isLastLine(currentLineText)) {
    return [currentLineStartIndex, currentLineLength];
  }
  return [currentLineStartIndex, currentLineLength - 1];
};
var getCurrentLineStartIndex = () => {
  return getCurrentLineRange()[0];
};
var getCurrentLineLength = () => {
  return getCurrentLineRange()[1];
};
var getCurrentLineEndIndex = () => {
  return getCurrentLineStartIndex() + getCurrentLineLength();
};
var getSelectionOrCurrentLineRange = () => {
  const selectedText = getSelectedText();
  if (!selectedText) {
    return getCurrentLineRange();
  } else {
    return getSelectedRange();
  }
};
var getSelectionOrCurrentLineStartIndex = () => {
  return getSelectionOrCurrentLineRange()[0];
};
var getSelectionOrCurrentLineLength = () => {
  return getSelectionOrCurrentLineRange()[1];
};
var getTextfromRange = (startIndex, length) => {
  return editor.getTextInRange(startIndex, length);
};
var getTextFromStartEnd = (startIndex, endIndex) => {
  return getTextfromRange(startIndex, endIndex - startIndex);
};
var getCurrentLineText = () => {
  return getTextfromRange(...getCurrentLineRange());
};
var getSelectedTextOrCurrentLine = () => {
  const selectedText = getSelectedText();
  if (!selectedText) {
    return getCurrentLineText();
  } else {
    return selectedText;
  }
};
var getTextBefore = (positionIndex) => {
  return getTextFromStartEnd(0, positionIndex);
};
var getTextAfter = (positionIndex) => {
  const endOfDraft = getDraftLength();
  return getTextFromStartEnd(positionIndex, endOfDraft);
};
var getPreviousOccurrenceIndex = (char, cursorPosition) => {
  const textBeforeCursor = getTextBefore(cursorPosition);
  const previousOccurrenceIndex = textBeforeCursor.lastIndexOf(char);
  return previousOccurrenceIndex === -1 ? 0 : previousOccurrenceIndex;
};
var getNextOccurrenceIndex = (char, cursorPosition) => {
  const nextOccurrenceIndex = draft.content.indexOf(char, cursorPosition + 1);
  return nextOccurrenceIndex === -1 ? getDraftLength() : nextOccurrenceIndex;
};

// src/helpers-set-text.ts
var setSelectedText = (text) => {
  editor.setSelectedText(text);
};
var setTextinRange = (text, startIndex, length) => {
  editor.setTextInRange(startIndex, length, text);
};
var setSelectionRange = (selectionStartIndex, selectionLength) => {
  editor.setSelectedRange(selectionStartIndex, selectionLength);
};
var setSelectionStartEnd = (selectionStartIndex, selectionEndIndex) => {
  setSelectionRange(selectionStartIndex, selectionEndIndex - selectionStartIndex);
};
var setSelectionRangeKeepNewline = (selectionStartIndex, selectionLength) => {
  const selectedText = getTextfromRange(selectionStartIndex, selectionLength);
  if (isLastLine(selectedText)) {
    setSelectionRange(selectionStartIndex, selectionLength);
  } else {
    setSelectionRange(selectionStartIndex, selectionLength - 1);
  }
};
var setCursorPosition = (newCursorPosition) => {
  setSelectionRange(newCursorPosition, 0);
};
var trimSelectedText = (selectionStartIndex, selectionEndIndex) => {
  const selectedText = getTextFromStartEnd(selectionStartIndex, selectionEndIndex);
  const trimmedText = selectedText.trim();
  const trimmedTextStart = selectionStartIndex + selectedText.indexOf(trimmedText);
  const trimmedTextEnd = trimmedTextStart + trimmedText.length;
  return [trimmedTextStart, trimmedTextEnd];
};
var insertTextAndSetCursor = (text, selectionStartIndex) => {
  setSelectedText(text);
  setCursorPosition(selectionStartIndex + text.length);
};
var transformSelectedText = (transformationFunction) => {
  const selectedText = getSelectedText();
  return transformationFunction(selectedText);
};
var transformAndReplaceSelectedText = (transformationFunction) => {
  const transformedText = transformSelectedText(transformationFunction);
  setSelectedText(transformedText);
};

// src/helpers-utils.ts
var getClipboard = () => {
  return app.getClipboard();
};
var copyToClipboard = (text) => {
  app.setClipboard(text);
};
var copySelectedTextToClipboard = () => {
  const selectedText = getSelectedText();
  copyToClipboard(selectedText);
};
var isUrl = (s) => {
  const urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return urlRegex.test(s);
};
var getUrlFromClipboard = () => {
  const clipboard = getClipboard();
  return isUrl(clipboard) ? clipboard : "";
};
function log(message, critical = false) {
  console.log(message);
  if (critical) {
    alert(message);
  }
}
function showAlert(title, message) {
  alert(`${title}

${message}`);
}
function getTodoistCredential() {
  const credential = Credential.create("Todoist", "Todoist API access");
  credential.addPasswordField("token", "API Token");
  credential.authorize();
  const todoist = Todoist.create();
  todoist.token = credential.getValue("token");
  return todoist;
}

// src/actions-editing-copycutdelete.ts
class CopyCutDelete {
  lineStartIndex;
  lineLength;
  text;
  cursorPosition;
  constructor() {
    [this.lineStartIndex, this.lineLength] = getCurrentLineRange();
    this.text = getTextfromRange(this.lineStartIndex, this.lineLength);
    this.cursorPosition = getCursorPosition();
  }
  addNewlineIfEndOfDraft = () => {
    return isLastLine(this.text) ? `
` : "";
  };
  copyLineUp = () => {
    setTextinRange(this.text + this.addNewlineIfEndOfDraft(), this.lineStartIndex, 0);
    setCursorPosition(this.cursorPosition);
  };
  copyLineDown = () => {
    const newlineIfEndOfDraft = this.addNewlineIfEndOfDraft();
    setTextinRange(newlineIfEndOfDraft + this.text, this.lineStartIndex + this.lineLength, 0);
    setCursorPosition(this.cursorPosition + this.lineLength + newlineIfEndOfDraft.length);
  };
  copyLineToClipboard = () => {
    const selectedText = getSelectedTextOrCurrentLine();
    copyToClipboard(selectedText);
  };
  cutLine = () => {
    const selectedRange = getSelectionOrCurrentLineRange();
    const selectedText = getTextfromRange(...selectedRange);
    copyToClipboard(selectedText);
    setSelectionRangeKeepNewline(...selectedRange);
    setSelectedText("");
  };
  deleteLine = () => {
    setTextinRange("", this.lineStartIndex, this.lineLength);
    let remainingText = getTextfromRange(this.lineStartIndex + this.lineLength - 2, getDraftLength()).trim();
    if (remainingText) {
      setCursorPosition(this.lineStartIndex);
    } else {
      setCursorPosition(this.lineStartIndex - 1);
      const previousLineStartIndex = getCurrentLineStartIndex();
      setCursorPosition(previousLineStartIndex);
    }
  };
}
var copyLineUp = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.copyLineUp();
};
var copyLineDown = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.copyLineDown();
};
var copyLineToClipboard = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.copyLineToClipboard();
};
var cutLine = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.cutLine();
};
var deleteLine = () => {
  const copyCutDelete = new CopyCutDelete;
  copyCutDelete.deleteLine();
};
// src/actions-editing-selection.ts
var selectSection = (sectionSeparator) => {
  const cursorPosition = getCursorPosition();
  const previousSeparatorPosition = getPreviousOccurrenceIndex(sectionSeparator, cursorPosition);
  const nextSeparatorPosition = getNextOccurrenceIndex(sectionSeparator, cursorPosition);
  const sectionStart = previousSeparatorPosition === 0 ? previousSeparatorPosition : previousSeparatorPosition + sectionSeparator.length;
  const sectionEnd = nextSeparatorPosition;
  const [trimmedSectionStart, trimmedSectionEnd] = trimSelectedText(sectionStart, sectionEnd);
  setSelectionRange(trimmedSectionStart, trimmedSectionEnd - trimmedSectionStart);
};
var selectLine = () => {
  selectSection(`
`);
};
var selectParagraph = () => {
  selectSection(`

`);
};
var selectResponse = () => {
  selectSection("---");
  copySelectedTextToClipboard();
};
var selectAll = () => {
  const endOfDraft = getDraftLength();
  setSelectionRange(0, endOfDraft);
};
// src/actions-editing-utils.ts
var insertDictation = () => {
  const [selectionStartIndex, selectionLength] = getSelectedRange();
  const dictatedText = editor.dictate();
  if (dictatedText) {
    setTextinRange(dictatedText, selectionStartIndex, selectionLength);
    setCursorPosition(selectionStartIndex + dictatedText.length);
    editor.activate();
  }
};
var pasteClipboard = () => {
  const clipboard = getClipboard();
  const selectionStartIndex = getSelectionStartIndex();
  insertTextAndSetCursor(clipboard, selectionStartIndex);
};
// src/actions-navigation.ts
var moveCursorLeft = () => {
  const selectionStartIndex = getSelectionStartIndex();
  if (selectionStartIndex > 0) {
    setSelectionRange(selectionStartIndex - 1, 0);
  }
};
var moveCursorRight = () => {
  const selectionStartIndex = getSelectionStartIndex();
  setSelectionRange(selectionStartIndex + 1, 0);
};
var jumpToPreviousHeader = () => {
  const cursorPosition = getCursorPosition();
  const previousHeaderPosition = getPreviousOccurrenceIndex(`
#`, cursorPosition) + 1;
  if (previousHeaderPosition === 1) {
    setCursorPosition(0);
  } else {
    setCursorPosition(previousHeaderPosition);
  }
};
var jumpToNextHeader = () => {
  const cursorPosition = getCursorPosition();
  const nextHeaderPosition = getNextOccurrenceIndex(`
#`, cursorPosition) + 1;
  setCursorPosition(nextHeaderPosition);
};
// src/actions-markdown-highlighting.ts
class SyntaxHighlighter {
  selectionStartIndex;
  selectionLength;
  selectionEndIndex;
  selectedText;
  constructor() {
    [this.selectionStartIndex, this.selectionLength] = getSelectedRange();
    this.selectionEndIndex = getSelectionEndIndex(this.selectionStartIndex, this.selectionLength);
    this.selectedText = getSelectedText();
  }
  textIsSelected = () => {
    return this.selectionLength > 0;
  };
  innerTextIsHighlighted = (highlightPrefix, highlightSuffix) => {
    const textBeforeSelection = getTextBefore(this.selectionStartIndex);
    const textAfterSelection = getTextAfter(this.selectionEndIndex);
    return textBeforeSelection.endsWith(highlightPrefix) && textAfterSelection.startsWith(highlightSuffix);
  };
  outerTextIsHighlighted = (highlightPrefix, highlightSuffix) => {
    return this.selectedText.startsWith(highlightPrefix) && this.selectedText.endsWith(highlightSuffix);
  };
  textIsHighlightedAsymmetric = (highlightPrefix, highlightSuffix) => {
    return this.innerTextIsHighlighted(highlightPrefix, highlightSuffix) || this.outerTextIsHighlighted(highlightPrefix, highlightSuffix);
  };
  textIsHighlightedSymmetric = (highlightChar) => {
    return this.textIsHighlightedAsymmetric(highlightChar, highlightChar);
  };
  addHighlightAsymmetric = (highlightPrefix, highlightSuffix) => {
    setSelectedText(highlightPrefix + this.selectedText + highlightSuffix);
    setCursorPosition(this.selectionEndIndex + highlightPrefix.length + highlightSuffix.length);
  };
  addHighlightSymmetric = (highlightChar) => {
    this.addHighlightAsymmetric(highlightChar, highlightChar);
  };
  removeHighlightAsymmetric = (highlightPrefix, highlightSuffix) => {
    if (this.outerTextIsHighlighted(highlightPrefix, highlightSuffix)) {
      setSelectedText(this.selectedText.slice(highlightPrefix.length, -highlightSuffix.length));
      return;
    }
    setSelectionStartEnd(this.selectionStartIndex - highlightPrefix.length, this.selectionEndIndex + highlightSuffix.length);
    setSelectedText(this.selectedText);
  };
  removeHighlightSymmetric = (highlightChar) => {
    this.removeHighlightAsymmetric(highlightChar, highlightChar);
  };
  insertOpeningOrClosingCharacter = (highlightChar) => {
    setSelectedText(highlightChar);
    setCursorPosition(this.selectionStartIndex + highlightChar.length);
  };
  addOrRemoveHighlightSymmetric = (highlightChar) => {
    if (!this.textIsSelected()) {
      this.insertOpeningOrClosingCharacter(highlightChar);
      return;
    }
    if (this.textIsHighlightedSymmetric(highlightChar)) {
      this.removeHighlightSymmetric(highlightChar);
      return;
    }
    this.addHighlightSymmetric(highlightChar);
  };
  addOrRemoveHighlightAsymmetric = (highlightPrefix, highlightSuffix) => {
    if (!this.textIsSelected()) {
      const textBeforeCursor = getTextBefore(this.selectionStartIndex);
      const lastPrefixIndex = textBeforeCursor.lastIndexOf(highlightPrefix);
      const lastSuffixIndex = textBeforeCursor.lastIndexOf(highlightSuffix);
      if (lastPrefixIndex > lastSuffixIndex) {
        this.insertOpeningOrClosingCharacter(highlightSuffix);
      } else {
        this.insertOpeningOrClosingCharacter(highlightPrefix);
      }
      return;
    }
    if (this.textIsHighlightedAsymmetric(highlightPrefix, highlightSuffix)) {
      this.removeHighlightAsymmetric(highlightPrefix, highlightSuffix);
      return;
    }
    this.addHighlightAsymmetric(highlightPrefix, highlightSuffix);
  };
}
var highlightBold = () => {
  const syntaxHighlighter = new SyntaxHighlighter;
  syntaxHighlighter.addOrRemoveHighlightSymmetric("**");
};
var highlightItalic = () => {
  const syntaxHighlighter = new SyntaxHighlighter;
  syntaxHighlighter.addOrRemoveHighlightSymmetric("*");
};
var highlightCode = () => {
  const syntaxHighlighter = new SyntaxHighlighter;
  syntaxHighlighter.addOrRemoveHighlightSymmetric("`");
};
var highlightCodeBlock = () => {
  const syntaxHighlighter = new SyntaxHighlighter;
  syntaxHighlighter.addOrRemoveHighlightAsymmetric("```\n", "\n```");
};
// src/actions-markdown-links.ts
class MarkdownLink {
  selectedText;
  selectionStartIndex;
  selectionLength;
  url;
  prefix;
  constructor(selectedText, selectionStartIndex, selectionLength, url, prefix) {
    this.selectedText = selectedText;
    this.selectionStartIndex = selectionStartIndex;
    this.selectionLength = selectionLength;
    this.url = url;
    this.prefix = prefix;
  }
  insertEmptyLink() {
    setSelectedText(`${this.prefix}[]()`);
    setCursorPosition(this.selectionStartIndex + 1);
  }
  insertTextLink() {
    setSelectedText(`${this.prefix}[${this.selectedText}]()`);
    setCursorPosition(this.selectionStartIndex + this.selectionLength + 3);
  }
  insertUrlLink() {
    setSelectedText(`${this.prefix}[](${this.url})`);
    setCursorPosition(this.selectionStartIndex + 1);
  }
  insertFullLink() {
    setSelectedText(`${this.prefix}[${this.selectedText}](${this.url})`);
    setCursorPosition(this.selectionStartIndex + this.selectionLength + this.url.length + 4);
  }
}
var insertMarkdownLinkWithPrefix = (prefix) => {
  const url = getUrlFromClipboard();
  const selectedText = getSelectedText();
  const [selectionStartIndex, selectionLength] = getSelectedRange();
  const markdownLink = new MarkdownLink(selectedText, selectionStartIndex, selectionLength, url, prefix);
  if (url.length == 0 && selectionLength == 0) {
    markdownLink.insertEmptyLink();
    return;
  }
  if (url.length == 0) {
    markdownLink.insertTextLink();
    return;
  }
  if (selectionLength == 0) {
    markdownLink.insertUrlLink();
    return;
  }
  markdownLink.insertFullLink();
};
var insertMarkdownLink = () => {
  insertMarkdownLinkWithPrefix("");
};
var insertMarkdownImage = () => {
  insertMarkdownLinkWithPrefix("!");
};
// src/actions-markdown-lists.ts
var getIndentation = (lineText) => {
  const indentationRegex = /^(\s*)/;
  const indentationMatch = lineText.match(indentationRegex);
  if (!indentationMatch) {
    return "";
  }
  return indentationMatch[1];
};
var checkIfLineIsListItem = (lineText) => {
  const listItemRegex = /^(\s*)([-*+]|\d+\.)\s/;
  const listItemMatch = lineText.match(listItemRegex);
  if (!listItemMatch) {
    return false;
  }
  return true;
};
var linebreakKeepIndentation = () => {
  const currentLineStartIndex = getCurrentLineStartIndex();
  const currentLineEndIndex = getCurrentLineEndIndex();
  const currentLineText = getTextFromStartEnd(currentLineStartIndex, currentLineEndIndex);
  let indentation = getIndentation(currentLineText);
  const isListItem = checkIfLineIsListItem(currentLineText);
  if (isListItem) {
    indentation += "  ";
  }
  const newLineText = `
${indentation}`;
  insertTextAndSetCursor(newLineText, currentLineEndIndex);
};
// src/actions-markdown-tasks.ts
class ToggleMarkdown {
  taskState;
  taskPatterns;
  CheckboxPatterns;
  constructor() {
    this.taskState = {
      uncheckedBox: "[ ]",
      checkedBox: "[x]",
      uncheckedTask: "- [ ]",
      checkedTask: "- [x]"
    };
    this.taskPatterns = [
      this.taskState.uncheckedTask,
      this.taskState.checkedTask
    ];
    this.CheckboxPatterns = Object.values(this.taskState);
  }
  lineHasPattern(line, patterns) {
    const trimmedLine = line.trim();
    return patterns.some((pattern) => trimmedLine.startsWith(pattern));
  }
  selectionHasItem(selectedLines, checkFunction) {
    return selectedLines.some((line) => checkFunction(line));
  }
  toggleMarkdown = (toggleFunction) => {
    const selectionStartIndex = getSelectionOrCurrentLineStartIndex();
    const selectionLength = getSelectionOrCurrentLineLength();
    const selection = getTextfromRange(selectionStartIndex, selectionLength);
    const toggledSelection = toggleFunction(selection);
    setSelectionRange(selectionStartIndex, selectionLength);
    setSelectedText(toggledSelection);
    const toggledSelectionEndIndex = getSelectionEndIndex(selectionStartIndex, toggledSelection.length);
    setCursorPosition(toggledSelectionEndIndex);
  };
  lineHasTask(line) {
    return this.lineHasPattern(line, this.taskPatterns);
  }
  removeTaskMarkerIfRequired(line) {
    for (let taskPattern of this.taskPatterns) {
      line = line.replace(taskPattern, "").trim();
    }
    return line;
  }
  addTaskMarkerIfRequired(line) {
    if (this.lineHasTask(line) || line.trim() === "") {
      return line;
    }
    if (line.trim().startsWith("-")) {
      return `${this.taskState.uncheckedTask} ${line.replace("-", "")}`;
    }
    return `${this.taskState.uncheckedTask} ${line}`;
  }
  selectionHasTask(selectedLines) {
    return this.selectionHasItem(selectedLines, (line) => this.lineHasTask(line));
  }
  toggleTasksSelection = (selection) => {
    const selectedLines = selection.split(`
`);
    if (this.selectionHasTask(selectedLines)) {
      return selectedLines.map((line) => this.removeTaskMarkerIfRequired(line)).join(`
`);
    }
    return selectedLines.map((line) => this.addTaskMarkerIfRequired(line)).join(`
`);
  };
  toggleMarkdownTasks = () => {
    this.toggleMarkdown(this.toggleTasksSelection);
  };
  lineHasCheckbox(line) {
    return this.lineHasPattern(line, this.CheckboxPatterns);
  }
  lineIsChecked(line) {
    return line.includes(this.taskState.checkedBox);
  }
  checkBox(line) {
    if (!this.lineHasCheckbox(line)) {
      return line;
    }
    return line.replace(this.taskState.uncheckedBox, this.taskState.checkedBox);
  }
  uncheckBox(line) {
    if (!this.lineHasCheckbox(line)) {
      return line;
    }
    return line.replace(this.taskState.checkedBox, this.taskState.uncheckedBox);
  }
  selectionIsChecked(selectedLines) {
    return this.selectionHasItem(selectedLines, (line) => this.lineHasCheckbox(line) && this.lineIsChecked(line));
  }
  toggleCheckboxesSelection = (selection) => {
    const selectedLines = selection.split(`
`);
    if (this.selectionIsChecked(selectedLines)) {
      return selectedLines.map((line) => this.uncheckBox(line)).join(`
`);
    }
    return selectedLines.map((line) => this.checkBox(line)).join(`
`);
  };
  toggleMarkdownCheckboxes = () => {
    this.toggleMarkdown(this.toggleCheckboxesSelection);
  };
}
var toggleMarkdownTasks = () => {
  const toggleMarkdown = new ToggleMarkdown;
  toggleMarkdown.toggleMarkdownTasks();
};
var toggleMarkdownCheckboxes = () => {
  const toggleMarkdown = new ToggleMarkdown;
  toggleMarkdown.toggleMarkdownCheckboxes();
};
// src/actions-transform-case.ts
var removeExtraWhitespace = (s) => {
  return s.trim().replace(/\s+/g, " ");
};
var removeWhitespace = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).replace(/\s/g, "");
  });
};
var trimWhitespace = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).trim();
  });
};
var toLowerCaseCustom = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).toLowerCase();
  });
};
var toUpperCaseCustom = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).toUpperCase();
  });
};
var _toTitleCaseWord = (str) => {
  if (!str) {
    return "";
  }
  const firstLetter = str[0];
  return str.length == 1 ? firstLetter : firstLetter.toUpperCase() + str.slice(1);
};
var _toTitleCase = (str) => {
  return removeExtraWhitespace(str).split(" ").map(_toTitleCaseWord).join(" ");
};
var toTitleCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return _toTitleCase(selectedText);
  });
};
var capitalize = () => {
  transformAndReplaceSelectedText((selectedText) => {
    const noExtraWhitespace = removeExtraWhitespace(selectedText);
    return noExtraWhitespace[0].toUpperCase() + noExtraWhitespace.slice(1).toLowerCase();
  });
};
var _toMemeCaseWord = (str) => {
  let transformed_chars = [];
  for (let [i, char] of str.split("").entries()) {
    if (i % 2 == 0) {
      transformed_chars.push(char.toLowerCase());
    } else {
      transformed_chars.push(char.toUpperCase());
    }
  }
  return transformed_chars.join("");
};
var toMemeCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return removeExtraWhitespace(selectedText).split(" ").map(_toMemeCaseWord).join(" ");
  });
};
var replaceWhitespace = (str, replacement) => {
  return removeExtraWhitespace(str).replace(/\s/g, replacement);
};
var toSnakeCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return replaceWhitespace(selectedText, "_");
  });
};
var toHyphenCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return replaceWhitespace(selectedText, "-");
  });
};
var toPascalCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    const noExtraWhitespace = removeExtraWhitespace(selectedText);
    const titleCase = _toTitleCase(noExtraWhitespace);
    return titleCase.replace(/\s/g, "");
  });
};
var toCamelCase = () => {
  transformAndReplaceSelectedText((selectedText) => {
    const noExtraWhitespace = removeExtraWhitespace(selectedText);
    const titleCase = _toTitleCase(noExtraWhitespace);
    return titleCase[0].toLowerCase() + titleCase.slice(1).replace(/\s/g, "");
  });
};
var sortLines = () => {
  transformAndReplaceSelectedText((selectedText) => {
    return selectedText.split(`
`).sort((a, b) => a.localeCompare(b)).join(`
`);
  });
};
// src/actions-transform-math.ts
class MathEvaluator {
  trimmedText;
  separator;
  numbers;
  constructor() {
    this.trimmedText = removeExtraWhitespace(getSelectedText()).trim();
    this.separator = this.findSeparator();
    this.numbers = this.splitBySeparator();
  }
  evaluate() {
    const sanitizedExpression = this.trimmedText.replace(/[^0-9+\-*/(). ]/g, "");
    const result = eval(sanitizedExpression);
    return String(result);
  }
  findSeparator() {
    const separators = [",", ";"];
    for (const separator of separators) {
      if (this.trimmedText.includes(separator)) {
        return separator;
      }
    }
    return " ";
  }
  splitBySeparator() {
    const separator = this.findSeparator();
    return this.trimmedText.split(separator).map((n) => Number(n));
  }
  sumToInt() {
    return this.numbers.reduce((a, b) => a + b, 0);
  }
  sum() {
    return this.sumToInt().toString();
  }
  product() {
    return this.numbers.reduce((a, b) => a * b, 1).toString();
  }
  max() {
    return Math.max(...this.numbers).toString();
  }
  min() {
    return Math.min(...this.numbers).toString();
  }
  mean() {
    return (this.sumToInt() / this.numbers.length).toString();
  }
}
var evaluateMathExpression = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.evaluate();
  });
};
var sum = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.sum();
  });
};
var product = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.product();
  });
};
var max = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.max();
  });
};
var min = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.min();
  });
};
var mean = () => {
  const mathEvaluator = new MathEvaluator;
  transformAndReplaceSelectedText(() => {
    return mathEvaluator.mean();
  });
};
// src/actions-shortcuts.ts
var copyAllTagsToClipboard = () => {
  const uniqueTagsArray = Tag.query("");
  const sortedTags = uniqueTagsArray.sort().join(`
`);
  copyToClipboard(sortedTags);
};
// src/Actions/TaskActions/TaskMenus.ts
async function handleOverdueTasks(todoist) {
  log("Fetching overdue tasks...");
  const overdueTasks = await todoist.getTasks({ filter: "overdue" });
  log(`Fetched ${overdueTasks.length} overdue tasks.`);
  return overdueTasks;
}
async function handleDeadlineTasks(todoist) {
  log("Fetching tasks with deadlines for today or tomorrow...");
  let response = await todoist.request({
    url: "https://api.todoist.com/rest/v2/tasks",
    method: "GET"
  });
  if (!response.success) {
    log(`Failed to fetch tasks - Status code: ${response.statusCode}`, true);
    log(`Error: ${response.error}`);
    return [];
  }
  let allTasks = response.responseData;
  let today = new Date;
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let todayStr = today.toISOString().split("T")[0];
  let tomorrowStr = tomorrow.toISOString().split("T")[0];
  let deadlineTasks = allTasks.filter((task) => task.deadline && (task.deadline.date === todayStr || task.deadline.date === tomorrowStr));
  log(`Found ${deadlineTasks.length} tasks with deadlines for today or tomorrow`);
  return deadlineTasks;
}
async function handleNoTimeTasks(todoist) {
  log("Fetching tasks due today with no time set...");
  let allTodayTasks = await todoist.getTasks({ filter: "due: today" });
  let noTimeTasks = allTodayTasks.filter((t) => !t.due?.datetime);
  log(`Found ${noTimeTasks.length} tasks due today with no time.`);
  return noTimeTasks;
}
async function handleNoDurationTasks(todoist) {
  log("Fetching tasks due today with no duration...");
  let allTodayTasks = await todoist.getTasks({ filter: "due: today" });
  let noDurationTasks = allTodayTasks.filter((t) => !t.duration);
  log(`Found ${noDurationTasks.length} tasks due today with no duration.`);
  return noDurationTasks;
}
async function updateToToday(todoist, task) {
  let updateOptions = { content: task.content };
  const chosenTime = pickTimeForToday();
  if (!chosenTime)
    return;
  updateOptions.due_string = chosenTime;
  await todoist.updateTask(task.id, updateOptions);
}
async function moveToFuture(todoist, task) {
  const { pickFutureDate: pickFutureDate2 } = await Promise.resolve().then(() => exports_DateTimePrompts);
  let updateOptions = { content: task.content };
  const dateChoice = pickFutureDate2();
  if (!dateChoice)
    return;
  Object.assign(updateOptions, dateChoice);
  await todoist.updateTask(task.id, updateOptions);
}
async function assignDurationToTask(todoist, task) {
  log(`Assigning duration to task: "${task.content}"`);
  if (!task.due?.datetime) {
    log(`Task does not have a due time. Setting the due time to 1 hour from now so we can add a duration.`);
    const oneHourFromNow = new Date;
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    const isoTime = oneHourFromNow.toISOString();
    const timeUpdate = {
      content: task.content,
      due_datetime: isoTime
    };
    let setDueTimeSuccess = await todoist.updateTask(task.id, timeUpdate);
    if (!setDueTimeSuccess) {
      log(`Failed to set due time for ${task.content}. Aborting.`, true);
      return false;
    }
  }
  let durationPrompt = new Prompt;
  durationPrompt.title = "Assign Duration";
  durationPrompt.message = `Assign a duration for:
"${task.content}"`;
  const durations = ["15 minutes", "30 minutes", "1 hour", "2 hours", "Custom"];
  durations.forEach((d) => durationPrompt.addButton(d));
  durationPrompt.addButton("Skip");
  if (!durationPrompt.show()) {
    log(`User skipped assigning duration for "${task.content}"`);
    return false;
  }
  const userButton = durationPrompt.buttonPressed;
  if (userButton === "Skip") {
    log(`User pressed skip for "${task.content}". Setting default 60 minute duration...`);
    let skipDuration = 60;
    let skipUpdate = {
      content: task.content,
      duration: skipDuration,
      duration_unit: "minute"
    };
    let skipSuccess = await todoist.updateTask(task.id, skipUpdate);
    if (skipSuccess) {
      log(`Defaulted duration: ${skipDuration} minutes to "${task.content}" since user skipped setting a custom duration.`);
      return true;
    } else {
      log(`Failed to default duration for "${task.content}" - ${todoist.lastError}`, true);
      return false;
    }
  } else if (durations.includes(userButton)) {
    log(`User selected duration: ${userButton}`);
    if (userButton !== "Custom") {
      let [amount, unitText] = userButton.split(" ");
      let durationAmount = parseInt(amount);
      if (unitText.startsWith("hour")) {
        durationAmount = durationAmount * 60;
      }
      let durationUpdate = {
        content: task.content,
        duration: durationAmount,
        duration_unit: "minute"
      };
      let durationSuccess = await todoist.updateTask(task.id, durationUpdate);
      if (durationSuccess) {
        log(`Assigned duration: ${durationAmount} minutes to "${task.content}"`);
        return true;
      } else {
        log(`Failed to assign duration to "${task.content}" - ${todoist.lastError}`, true);
        return false;
      }
    } else {
      let customDurationPrompt = new Prompt;
      customDurationPrompt.title = "Custom Duration";
      customDurationPrompt.message = `Enter a custom duration for:
"${task.content}"`;
      customDurationPrompt.addTextField("customDuration", "Duration (e.g., 45 minutes)", "");
      customDurationPrompt.addButton("Save");
      customDurationPrompt.addButton("Cancel");
      if (customDurationPrompt.show()) {
        if (customDurationPrompt.buttonPressed === "Save") {
          let customDurationInput = customDurationPrompt.fieldValues["customDuration"];
          log(`User entered custom duration: ${customDurationInput}`);
          let customMatch = customDurationInput.match(/(\d+)\s*(minute|minutes|hour|hours|day|days)/i);
          if (customMatch) {
            let amount = parseInt(customMatch[1]);
            let unitInput = customMatch[2].toLowerCase();
            if (unitInput.startsWith("hour")) {
              amount = amount * 60;
            }
            let customDurationUpdate = {
              content: task.content,
              duration: amount,
              duration_unit: "minute"
            };
            let customDurationSuccess = await todoist.updateTask(task.id, customDurationUpdate);
            if (customDurationSuccess) {
              log(`Assigned custom duration: ${amount} minutes to "${task.content}"`);
              return true;
            } else {
              log(`Failed to assign custom duration to "${task.content}" - ${todoist.lastError}`, true);
              return false;
            }
          } else {
            log(`Invalid custom duration format: "${customDurationInput}"`, true);
            showAlert("Invalid Duration", "Please enter the duration like '45 minutes' or '2 hours'.");
            return false;
          }
        }
      }
    }
  }
  return false;
}

// src/Actions/TaskActions/TodoistEnhancedMenu.ts
async function runTodoistEnhancedMenu() {
  const todoist = getTodoistCredential();
  let mainPrompt = new Prompt;
  mainPrompt.title = "Manage Tasks";
  mainPrompt.message = "Select which category you want to fetch tasks for:";
  mainPrompt.addButton("Tasks Due Today (No Time)");
  mainPrompt.addButton("Tasks Due Today (No Duration)");
  mainPrompt.addButton("Overdue Tasks");
  mainPrompt.addButton("Deadline Tasks (Today/Tomorrow)");
  mainPrompt.addButton("Cancel");
  if (!mainPrompt.show() || mainPrompt.buttonPressed === "Cancel") {
    log("User cancelled the main prompt.");
    script.complete();
    return;
  }
  let tasksToStore = [];
  switch (mainPrompt.buttonPressed) {
    case "Tasks Due Today (No Time)":
      draft.setTemplateTag("TasksFilterUsed", "NoTime");
      tasksToStore = await handleNoTimeTasks(todoist);
      break;
    case "Tasks Due Today (No Duration)":
      draft.setTemplateTag("TasksFilterUsed", "NoDuration");
      tasksToStore = await handleNoDurationTasks(todoist);
      break;
    case "Overdue Tasks":
      draft.setTemplateTag("TasksFilterUsed", "Overdue");
      tasksToStore = await handleOverdueTasks(todoist);
      break;
    case "Deadline Tasks (Today/Tomorrow)":
      draft.setTemplateTag("TasksFilterUsed", "Deadline");
      tasksToStore = await handleDeadlineTasks(todoist);
      break;
  }
  draft.setTemplateTag("TasksForSelection", JSON.stringify(tasksToStore));
  showAlert("Tasks Fetched", "Tasks have been stored in the 'TasksForSelection' template tag. You may now run selectTasksStep to pick which tasks to act on.");
  script.complete();
}
// src/Actions/TaskActions/TodoistFlexibleFlow.ts
async function selectTasksStep() {
  log("selectTasksStep() started. Reading tasks from 'TasksForSelection' template tag.");
  try {
    const tasksData = draft.getTemplateTag("TasksForSelection") || "";
    if (!tasksData) {
      alert("No tasks found in 'TasksForSelection'. Did you run the previous step?");
      script.complete();
      return;
    }
    const tasks = JSON.parse(tasksData);
    log(`Found ${tasks.length} tasks from template tag to select from.`);
    if (tasks.length === 0) {
      alert("No tasks to select from.");
      script.complete();
      return;
    }
    const taskTitles = tasks.map((t) => t.content);
    const prompt = new Prompt;
    prompt.title = "Select Tasks";
    prompt.message = "Select one or more tasks to act on.";
    prompt.addSelect("selectedTasks", "Tasks", taskTitles, [], true);
    prompt.addButton("OK");
    prompt.addButton("Cancel");
    const userDidSelect = prompt.show();
    if (!userDidSelect || prompt.buttonPressed !== "OK") {
      log("User canceled or dismissed the task selection prompt.");
      script.complete();
      return;
    }
    const selectedContents = prompt.fieldValues["selectedTasks"] || [];
    if (!Array.isArray(selectedContents) || selectedContents.length === 0) {
      alert("No tasks selected.");
      script.complete();
      return;
    }
    const selectedTasks = tasks.filter((t) => selectedContents.includes(t.content));
    const filterUsed = draft.getTemplateTag("TasksFilterUsed") || "";
    const relevantActions = getActionsForFilter(filterUsed);
    const actionPrompt = new Prompt;
    actionPrompt.title = "Select Action";
    actionPrompt.message = "Choose an action for the selected tasks:";
    for (const action of relevantActions) {
      actionPrompt.addButton(action);
    }
    actionPrompt.addButton("Cancel");
    const actionDidShow = actionPrompt.show();
    if (!actionDidShow || actionPrompt.buttonPressed === "Cancel") {
      log("User canceled or dismissed the action selection prompt.");
      script.complete();
      return;
    }
    const chosenAction = actionPrompt.buttonPressed;
    log(`User selected action: "${chosenAction}"`);
    draft.setTemplateTag("SelectedTasksData", JSON.stringify(selectedTasks));
    draft.setTemplateTag("SelectedTasksAction", chosenAction);
    alert("Tasks and action have been saved. Run the next step to execute them.");
    log("selectTasksStep() completed. Template tags saved.");
    script.complete();
  } catch (error) {
    log(`Error in selectTasksStep: ${error}`, true);
    script.complete();
  }
}
async function executeSelectedTasksStep() {
  log("executeSelectedTasksStep() invoked.");
  const todoist = getTodoistCredential();
  try {
    const selectedTasksData = draft.getTemplateTag("SelectedTasksData") || "";
    const selectedAction = draft.getTemplateTag("SelectedTasksAction") || "";
    if (!selectedTasksData || !selectedAction) {
      alert("No stored tasks or action found. Did you run the selection step?");
      log("No tasks or action in template tags. Exiting.");
      script.complete();
      return;
    }
    const tasksToProcess = JSON.parse(selectedTasksData);
    log(`Retrieved ${tasksToProcess.length} tasks to process with action "${selectedAction}"`);
    if (tasksToProcess.length === 0) {
      alert("No tasks found in selection data.");
      script.complete();
      return;
    }
    switch (selectedAction) {
      case "Reschedule to Today": {
        for (const task of tasksToProcess) {
          await updateToToday(todoist, task);
        }
        break;
      }
      case "Reschedule to Tomorrow": {
        for (const task of tasksToProcess) {
          await todoist.updateTask(task.id, {
            content: task.content,
            due_string: "tomorrow"
          });
        }
        break;
      }
      case "Reschedule to Future": {
        for (const task of tasksToProcess) {
          await moveToFuture(todoist, task);
        }
        break;
      }
      case "Complete Tasks":
        await completeTasks(todoist, tasksToProcess);
        break;
      case "Remove Due Date":
        await removeTasksDueDate(todoist, tasksToProcess);
        break;
      case "Add Priority Flag":
        await setPriorityFlag(todoist, tasksToProcess);
        break;
      case "Assign Duration": {
        for (const task of tasksToProcess) {
          await assignDurationToTask(todoist, task);
        }
        break;
      }
      default:
        alert(`Unknown action: ${selectedAction}`);
        log(`Unknown action selected: "${selectedAction}"`, true);
        script.complete();
        return;
    }
    alert("Execution step completed successfully!");
    script.complete();
  } catch (error) {
    log(`Error in executeSelectedTasksStep: ${error}`, true);
    script.complete();
  }
}
async function completeTasks(todoist, tasks) {
  for (const task of tasks) {
    try {
      log(`Completing task "${task.content}" (id: ${task.id}).`);
      const closeSuccess = await todoist.closeTask(task.id);
      if (!closeSuccess) {
        log(`Failed to complete task id: ${task.id} - ${todoist.lastError}`, true);
      }
    } catch (err) {
      log(`Error completing task id: ${task.id} - ${String(err)}`, true);
    }
  }
}
async function removeTasksDueDate(todoist, tasks) {
  for (const task of tasks) {
    try {
      log(`Removing due date for task "${task.content}" (id: ${task.id}).`);
      const updateSuccess = await todoist.updateTask(task.id, {
        content: task.content,
        due_string: "no date"
      });
      if (!updateSuccess) {
        log(`Failed to remove due date from task id: ${task.id} - ${todoist.lastError}`, true);
      }
    } catch (err) {
      log(`Error removing due date for task id: ${task.id} - ${String(err)}`, true);
    }
  }
}
async function setPriorityFlag(todoist, tasks) {
  for (const task of tasks) {
    try {
      log(`Setting priority flag for task "${task.content}" (id: ${task.id}).`);
      const updateSuccess = await todoist.updateTask(task.id, {
        content: task.content,
        priority: 4
      });
      if (!updateSuccess) {
        log(`Failed to set priority flag for task id: ${task.id} - ${todoist.lastError}`, true);
      }
    } catch (err) {
      log(`Error setting priority flag for task id: ${task.id} - ${String(err)}`, true);
    }
  }
}
function getActionsForFilter(filterName) {
  switch (filterName) {
    case "NoTime":
      return ["Reschedule to Today", "Reschedule to Future", "Assign Duration"];
    case "NoDuration":
      return ["Assign Duration", "Remove Due Date"];
    case "Overdue":
      return ["Reschedule to Today", "Reschedule to Future", "Complete Tasks"];
    case "Deadline":
      return ["Reschedule to Tomorrow", "Remove Due Date", "Add Priority Flag"];
    default:
      return [
        "Reschedule to Today",
        "Reschedule to Tomorrow",
        "Reschedule to Future",
        "Complete Tasks",
        "Remove Due Date",
        "Add Priority Flag",
        "Assign Duration"
      ];
  }
}
// src/Actions/TaskActions/DailyDriverMenu.ts
async function runDailyDriverMenu() {
  const todoist = getTodoistCredential();
  const mainPrompt = new Prompt;
  mainPrompt.title = "Daily Driver";
  mainPrompt.message = "Quickly manage tasks for today. Choose an option:";
  mainPrompt.addButton("Handle Overdue Tasks Individually");
  mainPrompt.addButton("Shift Entire Day’s Schedule");
  mainPrompt.addButton("Complete All Overdue Tasks");
  mainPrompt.addButton("Cancel");
  if (!mainPrompt.show() || mainPrompt.buttonPressed === "Cancel") {
    log("User canceled the daily driver menu.");
    script.complete();
    return;
  }
  try {
    switch (mainPrompt.buttonPressed) {
      case "Handle Overdue Tasks Individually":
        await handleOverdueTasksIndividually(todoist);
        break;
      case "Shift Entire Day’s Schedule":
        await shiftAllTodayTasksBy(todoist);
        break;
      case "Complete All Overdue Tasks":
        await completeAllOverdueTasks(todoist);
        break;
    }
  } catch (err) {
    log("Error in DailyDriverMenu: " + String(err), true);
  }
  script.complete();
}
async function handleOverdueTasksIndividually(todoist) {
  log("Fetching overdue tasks for today...");
  const overdueTasks = await todoist.getTasks({ filter: "overdue | today" });
  if (!overdueTasks || overdueTasks.length === 0) {
    showAlert("No Overdue Tasks", "You have no overdue tasks for today.");
    return;
  }
  for (const task of overdueTasks) {
    log(`Processing overdue task: ${task.content}`);
    const p = new Prompt;
    p.title = "Overdue Task";
    p.message = `Task: "${task.content}"
Choose an action:`;
    p.addButton("Reschedule to Later Today");
    p.addButton("Reschedule to Tomorrow");
    p.addButton("Remove Due Date");
    p.addButton("Complete Task");
    p.addButton("Skip");
    if (!p.show() || p.buttonPressed === "Skip") {
      log(`Skipping task "${task.content}"`);
      continue;
    }
    switch (p.buttonPressed) {
      case "Reschedule to Later Today": {
        const laterToday = new Date;
        laterToday.setHours(18, 0, 0, 0);
        const updateOptions = {
          content: task.content,
          due_string: "today 6pm"
        };
        const updateSuccess = await todoist.updateTask(task.id, updateOptions);
        if (updateSuccess) {
          log(`Rescheduled "${task.content}" to later today via REST v2.`);
        } else {
          log(`Failed to reschedule "${task.content}" - ${todoist.lastError}`, true);
        }
        break;
      }
      case "Reschedule to Tomorrow": {
        const tomorrow = new Date;
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const updateOptionsTomorrow = {
          content: task.content,
          due_string: "tomorrow"
        };
        const updateSuccessTomorrow = await todoist.updateTask(task.id, updateOptionsTomorrow);
        if (updateSuccessTomorrow) {
          log(`Rescheduled "${task.content}" to tomorrow via REST v2.`);
        } else {
          log(`Failed to reschedule "${task.content}" - ${todoist.lastError}`, true);
        }
        break;
      }
      case "Remove Due Date": {
        const removeUpdateOptions = {
          content: task.content,
          due_string: "no date"
        };
        const removeSuccess = await todoist.updateTask(task.id, removeUpdateOptions);
        if (removeSuccess) {
          log(`Removed due date from "${task.content}" via REST v2.`);
        } else {
          log(`Failed to remove due date for "${task.content}" - ${todoist.lastError}`, true);
        }
        break;
      }
      case "Complete Task":
        await todoist.closeTask(task.id);
        log(`Completed "${task.content}".`);
        break;
    }
  }
}
async function shiftAllTodayTasksBy(todoist) {
  log("Fetching tasks for today to shift them...");
  const todayTasks = await todoist.getTasks({ filter: "due: today" });
  if (!todayTasks || todayTasks.length === 0) {
    showAlert("No Today Tasks", "You have no tasks scheduled for today.");
    return;
  }
  const p = new Prompt;
  p.title = "Shift Today’s Tasks";
  p.message = "Enter how many minutes to push all tasks forward:";
  p.addButton("15");
  p.addButton("30");
  p.addButton("45");
  p.addButton("60");
  p.addButton("Custom");
  p.addButton("Cancel");
  if (!p.show() || p.buttonPressed === "Cancel") {
    log("User canceled shifting tasks.");
    return;
  }
  let shiftMinutes = 0;
  switch (p.buttonPressed) {
    case "15":
    case "30":
    case "45":
    case "60":
      shiftMinutes = parseInt(p.buttonPressed);
      break;
    case "Custom": {
      const customPrompt = new Prompt;
      customPrompt.title = "Custom Shift";
      customPrompt.message = "Enter number of minutes to shift tasks:";
      customPrompt.addButton("OK");
      customPrompt.addButton("Cancel");
      if (!customPrompt.show() || customPrompt.buttonPressed === "Cancel") {
        log("User canceled custom shift.");
        return;
      }
      showAlert("Not Implemented", "Custom input for shifting is not yet implemented in this example.");
      return;
    }
  }
  for (const task of todayTasks) {
    if (task.due?.datetime) {
      try {
        const oldTime = new Date(task.due.datetime);
        oldTime.setMinutes(oldTime.getMinutes() + shiftMinutes);
        const newTimeISO = oldTime.toISOString();
        const success = await todoist.updateTask(task.id, {
          content: task.content,
          due_datetime: newTimeISO
        });
        if (!success) {
          log(`Failed to shift task ${task.content}`, true);
        } else {
          log(`Shifted "${task.content}" by ${shiftMinutes} minutes.`);
        }
      } catch (err) {
        log(`Error shifting "${task.content}": ${String(err)}`, true);
      }
    }
  }
  showAlert("Tasks Shifted", `All tasks for today have been shifted by ${shiftMinutes} minutes.`);
}
async function completeAllOverdueTasks(todoist) {
  log("Fetching overdue tasks to mark complete...");
  const overdueTasks = await todoist.getTasks({ filter: "overdue" });
  if (!overdueTasks || overdueTasks.length === 0) {
    showAlert("No Overdue Tasks", "You have no overdue tasks to complete.");
    return;
  }
  for (const task of overdueTasks) {
    try {
      const closeSuccess = await todoist.closeTask(task.id);
      if (!closeSuccess) {
        log(`Failed to complete "${task.content}"`, true);
      } else {
        log(`Completed overdue task "${task.content}".`);
      }
    } catch (err) {
      log(`Error completing overdue task: ${String(err)}`, true);
    }
  }
  showAlert("Overdue Tasks Completed", "All overdue tasks have been closed.");
}
// src/Actions/BatchProcessAction.ts
function runBatchProcessAction() {
  if (draft.hasTag("status::batch-processed")) {
    log("[BatchProcessAction] Draft has 'status::batch-processed'; skipping re-processing.");
    return;
  }
  log("[BatchProcessAction] Starting runBatchProcessAction...");
  let ephemeralJsonRaw = draft.content.trim();
  let ephemeralJson = {};
  let ephemeralHasDraftAction = false;
  try {
    let maybeParsed = JSON.parse(ephemeralJsonRaw);
    if (maybeParsed && maybeParsed.draftAction) {
      ephemeralJson = maybeParsed;
      ephemeralHasDraftAction = true;
      log("[BatchProcessAction] Detected ephemeral JSON with draftAction: " + ephemeralJson.draftAction);
    }
  } catch (err) {
    log("[BatchProcessAction] No ephemeral JSON found in draft.content or it didn't parse.");
  }
  let fallbackJsonRaw = "";
  if (!ephemeralHasDraftAction) {
    fallbackJsonRaw = draft.getTemplateTag("ExecutorData") || "";
    if (fallbackJsonRaw) {
      log("[BatchProcessAction] Found fallback JSON from ExecutorData tag.");
      try {
        let fallbackParsed = JSON.parse(fallbackJsonRaw);
        ephemeralJson = fallbackParsed;
        ephemeralHasDraftAction = !!fallbackParsed.draftAction;
      } catch (err) {
        log("[BatchProcessAction] Could not parse fallback ExecutorData JSON.", true);
      }
    }
  }
  if (!ephemeralHasDraftAction) {
    log("[BatchProcessAction] No ephemeral or fallback JSON with draftAction. We may just show an alert or skip.");
    showAlert("BatchProcessAction", "No 'draftAction' found in ephemeral JSON or ExecutorData. Nothing to process.");
    return;
  }
  let params = ephemeralJson.params || {};
  log("[BatchProcessAction] params = " + JSON.stringify(params));
  if (params.tasks) {
    log("[BatchProcessAction] Found tasks array. We'll re-queue 'ProcessItemsAction' with these tasks.");
    let storeObj = {
      draftAction: "ProcessItemsAction",
      tasks: params.tasks
    };
    let storeJson = JSON.stringify(storeObj);
    draft.setTemplateTag("ExecutorData", storeJson);
    log("[BatchProcessAction] Set ExecutorData with items to process.");
    const executor = Action.find("Drafts Action Executor");
    if (!executor) {
      log("[BatchProcessAction] Could not find 'Drafts Action Executor'", true);
      showAlert("Error", "Couldn't find Drafts Action Executor to continue.");
      return;
    }
    let success = app.queueAction(executor, draft);
    if (success) {
      log("[BatchProcessAction] Successfully queued Drafts Action Executor.");
    } else {
      log("[BatchProcessAction] Failed to queue Drafts Action Executor!", true);
    }
    return;
  }
  log("[BatchProcessAction] No tasks provided, so finishing. You can implement custom logic here.");
  showAlert("BatchProcessAction Complete", "Nothing to process or queued next step successfully.");
  draft.addTag("status::batch-processed");
  draft.update();
}
// src/Actions/DraftActionExecutor.ts
async function runDraftsActionExecutor() {
  if (draft.hasTag("status::processed")) {
    log("[DraftActionExecutor] Ephemeral draft has 'status::processed'; skipping re-processing.");
    return;
  }
  try {
    log("[DraftActionExecutor] Starting runDraftsActionExecutor...");
    log(`[DraftActionExecutor] Ephemeral draft content:
` + draft.content);
    let jsonData = {};
    let usedEphemeral = false;
    try {
      const parsed = JSON.parse(draft.content.trim());
      if (parsed && parsed.draftAction) {
        jsonData = parsed;
        usedEphemeral = true;
        log("[Executor] Found ephemeral JSON with action: " + jsonData.draftAction);
      }
    } catch {
      log("[Executor] No valid ephemeral JSON found, continuing...");
    }
    if (!usedEphemeral) {
      const fallbackData = draft.getTemplateTag("ExecutorData");
      if (fallbackData) {
        log("[Executor] Found fallback JSON in 'ExecutorData' tag.");
        try {
          const parsedFallback = JSON.parse(fallbackData);
          Object.assign(jsonData, parsedFallback);
        } catch {
          log("[Executor] Could not parse fallback JSON.", true);
        }
      }
    }
    if (!jsonData.draftAction) {
      log("[Executor] No 'draftAction' found in ephemeral/fallback JSON.");
      const p = new Prompt;
      p.title = "No draftAction Found";
      p.message = "Would you like to pick an action to run on the currently loaded draft in the editor?";
      p.addButton("Pick Action");
      p.addButton("Cancel");
      if (!p.show() || p.buttonPressed === "Cancel") {
        log("[Executor] User canceled or no ephemeral JSON. Exiting.");
        return;
      }
      const actionPrompt = new Prompt;
      actionPrompt.title = "Select Action";
      actionPrompt.message = "Choose an action to run on this draft:";
      actionPrompt.addButton("MyActionName");
      actionPrompt.addButton("BatchProcessAction");
      actionPrompt.addButton("Cancel");
      if (!actionPrompt.show() || actionPrompt.buttonPressed === "Cancel") {
        log("[Executor] User canceled second prompt. Exiting.");
        return;
      }
      const chosenActionName = actionPrompt.buttonPressed;
      log("[Executor] User selected fallback action: " + chosenActionName);
      const fallbackAction = Action.find(chosenActionName);
      if (!fallbackAction) {
        showAlert("Action Not Found", `Could not find an action named: "${chosenActionName}"`);
        return;
      }
      const success2 = app.queueAction(fallbackAction, draft);
      if (!success2) {
        log(`Failed to queue fallback action "${chosenActionName}".`, true);
      } else {
        log(`Queued fallback action "${chosenActionName}" successfully.`);
      }
      return;
    }
    log("[DraftActionExecutor] Parsed JSON:", false);
    log(JSON.stringify(jsonData), false);
    const actionName = jsonData.draftAction;
    log("[DraftActionExecutor] actionName: " + (actionName || "undefined"));
    if (!actionName) {
      showAlert("No Action Provided", "Please provide 'draftAction' in the JSON.");
      return;
    }
    let realDraft = null;
    if (jsonData.draftData) {
      log("[DraftActionExecutor] Found draftData. Creating a new draft with that data...");
      realDraft = Draft.create();
      if (typeof jsonData.draftData.content === "string") {
        realDraft.content = jsonData.draftData.content;
      }
      if (jsonData.draftData.title) {
        realDraft.addTag("title:" + jsonData.draftData.title);
      }
      if (jsonData.draftData.flagged === true) {
        realDraft.isFlagged = true;
      }
      realDraft.setTemplateTag("DraftData", JSON.stringify(jsonData.draftData));
      realDraft.update();
      log("[DraftActionExecutor] Created a new real draft. UUID = " + realDraft.uuid);
    } else {
      log("[DraftActionExecutor] No draftData object found in JSON.");
    }
    let draftForAction = realDraft || draft;
    if (jsonData.params) {
      log("[DraftActionExecutor] Found params. Storing in template tag 'CustomParams'.");
      draftForAction.setTemplateTag("CustomParams", JSON.stringify(jsonData.params));
    } else {
      log("[DraftActionExecutor] No params object found in JSON.");
    }
    const actionToQueue = Action.find(actionName);
    if (!actionToQueue) {
      showAlert("Action Not Found", `Could not find an action named: "${actionName}"`);
      return;
    }
    log("[DraftActionExecutor] Queuing action on draft: " + draftForAction.uuid);
    const success = app.queueAction(actionToQueue, draftForAction);
    if (!success) {
      log(`Failed to queue action "${actionName}".`, true);
    } else {
      log(`Queued action "${actionName}" successfully.`);
      draft.addTag("status::processed");
      draft.update();
    }
  } catch (error) {
    log(`Error in runDraftsActionExecutor: ${String(error)}`, true);
  } finally {
    if (!draft.isTrashed) {
      draft.trash();
      log("Trashed the ephemeral JSON draft (UUID: " + draft.uuid + ").");
    }
  }
}
// src/Actions/MyActionName.ts
function runMyActionName() {
  const draftDataRaw = draft.getTemplateTag("DraftData") || "";
  const customParamsRaw = draft.getTemplateTag("CustomParams") || "";
  let draftData = {};
  let customParams = {};
  try {
    if (draftDataRaw) {
      draftData = JSON.parse(draftDataRaw);
    }
    if (customParamsRaw) {
      customParams = JSON.parse(customParamsRaw);
    }
  } catch (error) {
    log("Error parsing template tags: " + String(error), true);
  }
  log("=== [MyActionName] runMyActionName() invoked ===");
  log("DraftData (parsed): " + JSON.stringify(draftData));
  log("CustomParams (parsed): " + JSON.stringify(customParams));
  if ((!draftData || Object.keys(draftData).length === 0) && (!customParams || Object.keys(customParams).length === 0)) {
    log("[MyActionName] No ephemeral JSON data found. Processing loaded draft directly...");
    const loadedContent = draft.content;
    log(`[MyActionName] Loaded draft content:
` + loadedContent);
    log("[MyActionName] Draft metadata:");
    log(" • UUID: " + draft.uuid);
    log(" • Title: " + draft.title);
    log(" • isTrashed: " + draft.isTrashed);
    log(" • isArchived: " + draft.isArchived);
    log(" • isFlagged: " + draft.isFlagged);
    log(" • Current Tags: " + draft.tags.join(", "));
    if (!draft.hasTag("status::processed")) {
      draft.addTag("status::processed");
      draft.update();
      log("[MyActionName] Added scoped tag 'status::processed' to the loaded draft.");
    }
    let draftSummary = `
UUID: ${draft.uuid}
Title: ${draft.title}
Tags: ${draft.tags.join(", ")}
isFlagged: ${draft.isFlagged}
isTrashed: ${draft.isTrashed}
isArchived: ${draft.isArchived}

Content:
${draft.content}
    `;
    showAlert("[MyActionName] No ephemeral JSON data", `We processed the loaded draft:
` + draftSummary);
  }
  const summary = `DraftData:
` + JSON.stringify(draftData, null, 2) + `

CustomParams:
` + JSON.stringify(customParams, null, 2);
  showAlert("MyActionName Summary", summary);
}
// src/Actions/BatchProcessTodoistAction.ts
function runBatchProcessTodoistAction() {
  const todoistTasks = [
    { id: 12345, content: "Todoist Task #1" },
    { id: 67890, content: "Todoist Task #2", due: { date: "2025-01-01" } }
  ];
  const fallbackJson = {
    draftAction: "MyActionName",
    params: {
      tasks: todoistTasks,
      source: "BatchProcessTodoistAction"
    }
  };
  draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackJson));
  log("[BatchProcessTodoistAction] Wrote fallback JSON to ExecutorData tag.");
  const executorAction = Action.find("Drafts Action Executor");
  if (!executorAction) {
    showAlert("Executor Not Found", "Unable to locate 'Drafts Action Executor'.");
    return;
  }
  const success = app.queueAction(executorAction, draft);
  if (success) {
    log("[BatchProcessTodoistAction] Successfully queued Drafts Action Executor.");
  } else {
    log("[BatchProcessTodoistAction] Failed to queue Drafts Action Executor.", true);
  }
}
// src/Actions/ManageDraftWithPrompt.ts
async function runManageDraftWithPrompt() {
  if (!draft) {
    log("No draft available!");
    return;
  }
  let d = draft;
  function getTicklerDate(content) {
    const match = content.match(/\[tickler:(\d{4}-\d{2}-\d{2})\]/);
    return match ? match[1] : null;
  }
  function isTicklerOverdue(dateStr) {
    if (!dateStr)
      return false;
    const ticklerDate = new Date(dateStr);
    const today = new Date;
    today.setHours(0, 0, 0, 0);
    return ticklerDate < today;
  }
  function getRelativeDateInfo(dateStr) {
    if (!dateStr)
      return null;
    const date = new Date(dateStr);
    const today = new Date;
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
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
  function isTicklerDueToday(dateStr) {
    if (!dateStr)
      return false;
    const ticklerDate = new Date(dateStr);
    const today = new Date;
    today.setHours(0, 0, 0, 0);
    return ticklerDate.getTime() === today.getTime();
  }
  function getDefaultAction() {
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
      ticklerDate: getTicklerDate(d.content)
    };
  }
  function getAvailableActions() {
    const state = getCurrentState();
    const primaryActions = new Set;
    const utilityActions = new Set;
    if (!state.isTrashed && !state.isArchived) {
      primaryActions.add("Archive");
      primaryActions.add("Delete");
    }
    if (state.isArchived || state.isTrashed) {
      primaryActions.add("Move to Inbox");
    }
    utilityActions.add("Flag/Unflag");
    utilityActions.add("Set Tickler");
    utilityActions.add("Cancel");
    return {
      primary: Array.from(primaryActions),
      utility: Array.from(utilityActions)
    };
  }
  async function promptForTicklerDate(isArchiving = false) {
    let p = new Prompt;
    p.title = isArchiving ? "When to return to inbox?" : "Select Tickler Date";
    const today = new Date;
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
    let result2 = p.show();
    let selectedDate = null;
    if (!result2 && isArchiving) {
      return await promptForTicklerDate(true);
    } else if (!result2) {
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
        let datePrompt = new Prompt;
        datePrompt.title = "Select Custom Date";
        datePrompt.addDatePicker("ticklerDate", "", new Date, {
          mode: "date",
          minimumDate: today
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
      let ticklerString = `

[tickler:` + formattedDate + "]";
      let content = d.content.replace(/\n\n\[tickler:[^\]]+\]/, "");
      d.content = content + ticklerString;
      d.update();
      log("Tickler set for: " + formattedDate);
      return true;
    }
    return false;
  }
  async function confirmArchiveWithWarning(message) {
    let p = new Prompt;
    p.title = "Archive Confirmation";
    p.message = message;
    p.addButton("Update Tickler");
    p.addButton("Archive Anyway");
    p.addButton("Cancel");
    const result2 = p.show();
    if (!result2 || p.buttonPressed === "Cancel") {
      return "cancel";
    }
    return p.buttonPressed;
  }
  async function ensureTicklerDateAndArchive() {
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
        let warningMessage = isOverdue ? "This draft has an overdue tickler date." : "This draft is due for review today.";
        warningMessage += `
Would you like to update the tickler date before archiving?`;
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
  async function moveToInbox() {
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
    let p = new Prompt;
    p.title = "Manage Draft";
    let status = '"' + d.title + `"

Current Status:
• Location: ` + (d.isArchived ? "Archive" : d.isTrashed ? "Trash" : "Inbox") + `
• ` + (d.isFlagged ? "\uD83C\uDFF3️ Flagged" : "⚪ Not Flagged") + `
• Tickler: ` + (ticklerInfo ? ticklerInfo : "None");
    if (isOverdue && currentTickler) {
      status += `

⚠️ Tickler date is overdue!`;
    }
    p.message = status;
    const defaultAction = getDefaultAction();
    const { primary, utility } = getAvailableActions();
    if (primary.includes(defaultAction)) {
      p.addButton(defaultAction);
    }
    primary.filter((action) => action !== defaultAction).forEach((action) => p.addButton(action));
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
        let currentIndex = workspaceDrafts.findIndex((dr) => dr.uuid === d.uuid);
        let nextDraft = null;
        for (let i = currentIndex + 1;i < workspaceDrafts.length; i++) {
          if (!workspaceDrafts[i].isTrashed && !workspaceDrafts[i].isArchived) {
            nextDraft = workspaceDrafts[i];
            break;
          }
        }
        if (!nextDraft) {
          for (let i = currentIndex - 1;i >= 0; i--) {
            if (!workspaceDrafts[i].isTrashed && !workspaceDrafts[i].isArchived) {
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
// src/Actions/ManageDraftWithPromptExecutor.ts
async function runManageDraftWithPromptExecutor() {
  if (!draft) {
    log("[ManageDraftWithPromptExecutor] No draft available!");
    script.complete();
    return;
  }
  const p = new Prompt;
  p.title = "Manage Draft via Executor?";
  p.message = "Choose how you'd like to handle this draft:";
  p.addButton("Manage with Prompt");
  p.addButton("Queue Executor for Another Action");
  p.addButton("Cancel");
  if (!p.show() || p.buttonPressed === "Cancel") {
    log("[ManageDraftWithPromptExecutor] User canceled.");
    script.complete();
    return;
  }
  if (p.buttonPressed === "Manage with Prompt") {
    log("[ManageDraftWithPromptExecutor] Redirecting to local manageDraftWithPrompt logic...");
    await localManageDraftWithPrompt(draft);
    script.complete();
    return;
  }
  if (p.buttonPressed === "Queue Executor for Another Action") {
    const fallbackJson = {
      draftAction: "MyActionName",
      params: {
        fromManageDraftPrompt: true,
        draftUUID: draft.uuid,
        draftContent: draft.content
      }
    };
    draft.setTemplateTag("ExecutorData", JSON.stringify(fallbackJson));
    const executor = Action.find("Drafts Action Executor");
    if (!executor) {
      showAlert("Executor Not Found", "Unable to locate 'Drafts Action Executor'.");
      script.complete();
      return;
    }
    const success = app.queueAction(executor, draft);
    if (!success) {
      log("[ManageDraftWithPromptExecutor] Failed to queue Drafts Action Executor!", true);
    } else {
      log("[ManageDraftWithPromptExecutor] Successfully queued Drafts Action Executor.");
    }
    script.complete();
    return;
  }
}
async function localManageDraftWithPrompt(d) {
  log("[localManageDraftWithPrompt] Starting...");
  const localPrompt = new Prompt;
  localPrompt.title = "Local Draft Prompt";
  localPrompt.message = `Draft Title: "${d.title}"
Draft UUID: ${d.uuid}`;
  localPrompt.addButton("OK");
  localPrompt.addButton("Cancel");
  if (!localPrompt.show()) {
    log("[localManageDraftWithPrompt] User canceled.");
    return;
  }
  log("[localManageDraftWithPrompt] User pressed: " + localPrompt.buttonPressed);
  if (localPrompt.buttonPressed === "OK") {
    d.isTrashed = true;
    d.update();
    log("[localManageDraftWithPrompt] Draft moved to trash.");
  }
}
