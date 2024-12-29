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
      tasksToStore = await handleNoTimeTasks(todoist);
      break;
    case "Tasks Due Today (No Duration)":
      tasksToStore = await handleNoDurationTasks(todoist);
      break;
    case "Overdue Tasks":
      tasksToStore = await handleOverdueTasks(todoist);
      break;
    case "Deadline Tasks (Today/Tomorrow)":
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
    const actionPrompt = new Prompt;
    actionPrompt.title = "Select Action";
    actionPrompt.message = "Choose an action for the selected tasks:";
    actionPrompt.addButton("Reschedule to Today");
    actionPrompt.addButton("Complete Tasks");
    actionPrompt.addButton("Remove Due Date");
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
      case "Reschedule to Today":
        await rescheduleTasksToToday(todoist, tasksToProcess);
        break;
      case "Complete Tasks":
        await completeTasks(todoist, tasksToProcess);
        break;
      case "Remove Due Date":
        await removeTasksDueDate(todoist, tasksToProcess);
        break;
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
async function rescheduleTasksToToday(todoist, tasks) {
  for (const task of tasks) {
    try {
      log(`Rescheduling task "${task.content}" (id: ${task.id}) to today.`);
      const updateSuccess = await todoist.updateTask(task.id, {
        content: task.content,
        due_string: "today"
      });
      if (!updateSuccess) {
        log(`Failed to reschedule task id: ${task.id} - ${todoist.lastError}`, true);
      }
    } catch (err) {
      log(`Error rescheduling task id: ${task.id} - ${String(err)}`, true);
    }
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
