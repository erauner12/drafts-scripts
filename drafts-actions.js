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
function logCustomMessage(msg, isError = false) {
  if (isError) {
    console.error(msg);
  } else {
    console.log(msg);
  }
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
// src/Actions/TaskActions/ManageOverdueTasks.ts
async function manageOverdueTasks() {
  logCustomMessage("manageOverdueTasks() invoked. Starting process.");
  try {
    logCustomMessage("Attempting to create and authorize Todoist credentials...");
    const credential = Credential.create("Todoist", "Todoist API Token");
    credential.addPasswordField("apiToken", "API Token");
    credential.authorize();
    logCustomMessage("Credentials authorized successfully.");
    logCustomMessage("System date/time is: " + new Date().toString());
    logCustomMessage("UTC date/time is: " + new Date().toUTCString());
    logCustomMessage("Timezone offset (minutes): " + new Date().getTimezoneOffset().toString());
    const TODOIST_API_TOKEN = credential.getValue("apiToken");
    const todoist = Todoist.create();
    logCustomMessage("Todoist API token set.");
    logCustomMessage("Fetching tasks filtered by 'overdue'...");
    const tasks = await todoist.getTasks({ filter: "overdue" });
    logCustomMessage("Retrieved " + tasks.length + " overdue tasks.");
    if (tasks.length > 0) {
      const allTaskContents = tasks.map((t) => t.id + ': "' + t.content + '"').join(", ");
      logCustomMessage("Overdue tasks from Todoist: [" + allTaskContents + "]");
    }
    if (tasks.length === 0) {
      alert("No overdue tasks found.");
      logCustomMessage("No overdue tasks retrieved from Todoist. Exiting script.");
      return;
    }
    const taskContents = tasks.map((task) => task.content);
    logCustomMessage("Creating prompt for user to select overdue tasks...");
    const taskPrompt = new Prompt;
    taskPrompt.title = "Overdue Tasks";
    taskPrompt.message = "Select overdue tasks to reschedule or complete:";
    taskPrompt.addSelect("selectedTasks", "Tasks", taskContents, [], true);
    taskPrompt.addButton("OK");
    const didShow = taskPrompt.show();
    logCustomMessage("Task selection prompt displayed: " + (didShow ? "User responded" : "User dismissed/canceled"));
    if (didShow && taskPrompt.buttonPressed === "OK") {
      const selectedTasks = tasks.filter((task) => taskPrompt.fieldValues["selectedTasks"].includes(task.content));
      logCustomMessage("User selected " + selectedTasks.length + " tasks for processing.");
      if (selectedTasks.length === 0) {
        logCustomMessage("No tasks selected by the user. Exiting script.");
        alert("No tasks selected.");
        return;
      }
      const actionPrompt = new Prompt;
      actionPrompt.title = "Select Action";
      actionPrompt.message = "Choose an action for the selected tasks:";
      actionPrompt.addButton("Reschedule to Today");
      actionPrompt.addButton("Complete Tasks");
      const actionDidShow = actionPrompt.show();
      logCustomMessage("Action prompt displayed: " + (actionDidShow ? "User responded" : "User dismissed/canceled"));
      if (actionDidShow) {
        const userAction = actionPrompt.buttonPressed;
        logCustomMessage("User selected action: " + userAction);
        draft.setTemplateTag("OverdueTasksData", JSON.stringify(selectedTasks));
        draft.setTemplateTag("OverdueTasksAction", userAction);
        alert("Selections saved. Please run the next step to execute changes.");
        logCustomMessage("manageOverdueTasks() completed user prompt logic successfully.");
      } else {
        logCustomMessage("User cancelled the action prompt. Exiting script.");
      }
    } else {
      logCustomMessage("User cancelled or dismissed the overdue tasks prompt. Exiting script.");
    }
  } catch (error) {
    logCustomMessage("Error in Manage Overdue Tasks script: " + error, true);
    alert("An error occurred: " + error);
  } finally {
    logCustomMessage("manageOverdueTasks() end of script reached. Finalizing.");
  }
}
function manageOverdueTasksAux() {
  logCustomMessage("manageOverdueTasksAux() called. Additional logic could go here.");
}

// src/Actions/TaskActions/TaskMenu.ts
var openTaskMenu = () => {
  logCustomMessage("TaskMenu: Starting menu prompt.");
  logCustomMessage("openTaskMenu() invoked - presenting the menu.");
  const prompt = new Prompt;
  prompt.title = "Task Management Menu";
  prompt.message = "Select an option to manage your tasks:";
  prompt.addButton("Manage Overdue Tasks");
  prompt.addButton("Manage Deadlines");
  prompt.addButton("Schedule Tasks for Tomorrow");
  prompt.addButton("Some Other Custom Action");
  prompt.addButton("Cancel");
  const didSelect = prompt.show();
  if (!didSelect || prompt.buttonPressed === "Cancel") {
    logCustomMessage("TaskMenu: User canceled or dismissed the prompt.");
    context.cancel("User canceled task menu");
    return;
  }
  logCustomMessage('TaskMenu: User selected "' + prompt.buttonPressed + '".');
  logCustomMessage("openTaskMenu() user pressed: " + prompt.buttonPressed);
  switch (prompt.buttonPressed) {
    case "Manage Overdue Tasks":
      logCustomMessage("User selected Manage Overdue Tasks - calling manageOverdueTasks()");
      manageOverdueTasks();
      break;
    case "Manage Deadlines":
      alert("You selected to manage deadlines. (Placeholder for ManageDeadlines action.)");
      break;
    case "Schedule Tasks for Tomorrow":
      alert("You selected to schedule tasks for tomorrow. (Placeholder for scheduling tasks.)");
      break;
    case "Some Other Custom Action":
      alert("You selected another custom action. (Placeholder for non-Todoist or other expansions.)");
      break;
    default:
      logCustomMessage("TaskMenu: Unexpected button pressed.");
      context.cancel("Unexpected button selection in task menu");
      break;
  }
};

// src/Actions/TaskActions/ActionRunner.ts
function actionRunner() {
  openTaskMenu();
}
// src/Actions/TaskActions/ManageOverdueTasksExec.ts
async function rescheduleTasksToToday(todoistClient, tasks) {
  for (const task of tasks) {
    try {
      logCustomMessage("Rescheduling task " + task.id + " to today...");
      await todoistClient.updateTask(task.id, {
        due_string: "today at 23:59",
        due_lang: "en"
      });
      logCustomMessage("Task " + task.id + " successfully rescheduled to today.");
      const updatedTask = await todoistClient.getTask(task.id);
      if (!updatedTask?.due) {
        logCustomMessage(`Task ${task.id} has no due date after update. Something is off.`, true);
      } else {
        logCustomMessage(`Task ${task.id} is now due on: ${updatedTask.due.date}`);
      }
    } catch (error) {
      logCustomMessage("Error rescheduling task " + task.id + ": " + String(error), true);
      alert("Error rescheduling task " + task.id + ": " + String(error));
    }
  }
}
async function completeTasks(todoistClient, tasks) {
  for (const task of tasks) {
    try {
      logCustomMessage("Completing task " + task.id + "...");
      await todoistClient.closeTask(task.id);
      logCustomMessage("Task " + task.id + " has been marked complete.");
    } catch (error) {
      logCustomMessage("Error completing task " + task.id + ": " + String(error), true);
      alert("Error completing task " + task.id + ": " + String(error));
    }
  }
}
async function executeOverdueTasksAction() {
  logCustomMessage("executeOverdueTasksAction() invoked. Starting execution step.");
  try {
    const selectedTasksData = draft.getTemplateTag("OverdueTasksData") || "";
    const selectedAction = draft.getTemplateTag("OverdueTasksAction") || "";
    if (!selectedTasksData || !selectedAction) {
      logCustomMessage("No stored tasks or action found in template tags. Exiting.");
      alert("No overdue tasks or action found. Make sure you ran Step 1 first.");
      return;
    }
    const selectedTasks = JSON.parse(selectedTasksData);
    logCustomMessage("Re-authorizing Todoist credentials...");
    const credential = Credential.create("Todoist", "Todoist API Token");
    credential.addPasswordField("apiToken", "API Token");
    credential.authorize();
    logCustomMessage("Credentials authorized successfully.");
    const TODOIST_API_TOKEN = credential.getValue("apiToken");
    const todoist = Todoist.create();
    todoist.token = TODOIST_API_TOKEN;
    logCustomMessage("Todoist API token set.");
    if (selectedAction === "Reschedule to Today") {
      await rescheduleTasksToToday(todoist, selectedTasks);
    } else if (selectedAction === "Complete Tasks") {
      await completeTasks(todoist, selectedTasks);
    } else {
      logCustomMessage(`Unknown action: ${selectedAction}`, true);
      alert("Unknown action selected: " + selectedAction);
    }
    alert("Tasks processed successfully!");
    logCustomMessage("executeOverdueTasksAction() finished successfully.");
  } catch (error) {
    logCustomMessage("Error in executeOverdueTasksAction: " + error, true);
    alert("An error occurred: " + error);
  }
}
// src/Actions/TaskActions/TodoistEnhancedMenu.ts
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
async function runTodoistEnhancedMenu() {
  const TODOIST_API_TOKEN = "20fdade709c084c2e255e56e57d0e53370e8283e";
  let todoist = Todoist.create();
  todoist.token = TODOIST_API_TOKEN;
  function getTodayDate() {
    let today = new Date;
    return today.toISOString().split("T")[0];
  }
  async function handleOverdueTasks() {
    log("Starting overdue tasks management...");
    let overdueTasks = await todoist.getTasks({ filter: "overdue" });
    if (overdueTasks.length === 0) {
      showAlert("No Overdue Tasks", "You have no overdue tasks to manage.");
      log("No overdue tasks found.");
      return;
    }
    log(`Found ${overdueTasks.length} overdue tasks.`);
    for (let task of overdueTasks) {
      let taskPrompt = new Prompt;
      taskPrompt.title = "Manage Overdue Task";
      taskPrompt.message = `Task: "${task.content}"
Original due: ${task.due ? task.due.string : "No date"}`;
      taskPrompt.addButton("Update to Today");
      taskPrompt.addButton("Move to Future");
      taskPrompt.addButton("Remove Due Date");
      taskPrompt.addButton("Complete Task");
      taskPrompt.addButton("Delete Task");
      taskPrompt.addButton("Skip");
      if (!taskPrompt.show()) {
        continue;
      }
      switch (taskPrompt.buttonPressed) {
        case "Update to Today":
          await handleUpdateToToday(task);
          break;
        case "Move to Future":
          await handleMoveToFuture(task);
          break;
        case "Remove Due Date":
          await handleRemoveDueDate(task);
          break;
        case "Complete Task":
          await todoist.closeTask(task.id);
          break;
        case "Delete Task":
          await todoist.closeTask(task.id);
          break;
        case "Skip":
          continue;
      }
    }
    showAlert("Completed", "Finished managing deadline tasks.");
  }
  async function handleUpdateToToday(task) {
    let timePrompt = new Prompt;
    timePrompt.title = "Set Time for Today";
    timePrompt.message = `How should this task be scheduled for today?`;
    timePrompt.addButton("Morning (9 AM)");
    timePrompt.addButton("Noon (12 PM)");
    timePrompt.addButton("No Specific Time");
    timePrompt.addButton("Custom Time");
    if (!timePrompt.show())
      return;
    let updateOptions = { content: task.content };
    switch (timePrompt.buttonPressed) {
      case "Morning (9 AM)":
        updateOptions.due_string = "today at 9am";
        break;
      case "Noon (12 PM)":
        updateOptions.due_string = "today at 12pm";
        break;
      case "No Specific Time":
        updateOptions.due_string = "today";
        break;
      case "Custom Time":
        let customPrompt = new Prompt;
        customPrompt.addDatePicker("time", "Select Time", new Date, {
          mode: "time"
        });
        if (customPrompt.show()) {
          let selectedTime = customPrompt.fieldValues["time"];
          let hours = selectedTime.getHours().toString().padStart(2, "0");
          let minutes = selectedTime.getMinutes().toString().padStart(2, "0");
          updateOptions.due_string = `today at ${hours}:${minutes}`;
        }
        break;
    }
    await todoist.updateTask(task.id, updateOptions);
  }
  async function handleMoveToFuture(task) {
    let datePrompt = new Prompt;
    datePrompt.title = "Move to Future Date";
    datePrompt.message = "When should this task be due?";
    datePrompt.addButton("Tomorrow");
    datePrompt.addButton("Next Week");
    datePrompt.addButton("Custom Date");
    if (!datePrompt.show())
      return;
    let updateOptions = { content: task.content };
    switch (datePrompt.buttonPressed) {
      case "Tomorrow":
        updateOptions.due_string = "tomorrow";
        break;
      case "Next Week":
        updateOptions.due_string = "next monday";
        break;
      case "Custom Date":
        let customPrompt = new Prompt;
        customPrompt.addDatePicker("date", "Select Date", new Date, {
          mode: "date"
        });
        if (customPrompt.show()) {
          let selectedDate = customPrompt.fieldValues["date"];
          updateOptions.due_date = selectedDate.toISOString().split("T")[0];
        }
        break;
    }
    await todoist.updateTask(task.id, updateOptions);
  }
  async function handleRemoveDueDate(task) {
    await todoist.updateTask(task.id, {
      content: task.content,
      due_string: "no date"
    });
  }
  try {
    log("Script started.");
    log("Fetching active tasks due today...");
    let allTasks = await todoist.getTasks({ filter: `due: today` });
    log(`Fetched ${allTasks.length} tasks due today.`);
    if (allTasks.length === 0) {
      showAlert("No Tasks", "You have no tasks due today.");
      log("No tasks due today.");
      script.complete();
      return;
    }
    let todayDate = getTodayDate();
    let tasksWithoutTime = [];
    let tasksWithoutDuration = [];
    allTasks.forEach((task) => {
      if (task.due && task.due.date === todayDate) {
        if (!task.due.datetime) {
          tasksWithoutTime.push(task);
        } else {
          if (!task.duration) {
            tasksWithoutDuration.push(task);
          }
        }
      }
    });
    log(`Filtered tasks into ${tasksWithoutTime.length} without due time and ${tasksWithoutDuration.length} without duration.`);
    let prompt = new Prompt;
    prompt.title = "Manage Tasks";
    prompt.message = "Choose an option to manage your tasks.";
    prompt.addButton("Assign Due Time and Duration");
    prompt.addButton("Assign Duration");
    prompt.addButton("Manage Overdue Tasks");
    prompt.addButton("Manage Deadline Tasks");
    prompt.addButton("Cancel");
    if (!prompt.show()) {
      log("User cancelled the main prompt.");
      script.complete();
      return;
    }
    log(`User selected: ${prompt.buttonPressed}`);
    switch (prompt.buttonPressed) {
      case "Assign Due Time and Duration":
        await handleAssignTimeAndDuration(tasksWithoutTime);
        break;
      case "Assign Duration":
        await handleAssignDuration(tasksWithoutDuration);
        break;
      case "Manage Overdue Tasks":
        await handleOverdueTasks();
        break;
      case "Manage Deadline Tasks":
        await handleDeadlineTasks();
        break;
      default:
        log("User cancelled the operation.");
        script.complete();
        return;
    }
    log("Script completed successfully.");
    script.complete();
  } catch (error) {
    log(`Unhandled error in script: ${error}`, true);
    showAlert("Script Error", `An unexpected error occurred: ${error}`);
    script.complete();
  }
  async function handleAssignTimeAndDuration(tasks) {
    if (tasks.length === 0) {
      showAlert("No Tasks", "No tasks found without a due time.");
      log("No tasks to assign due time and duration.");
      return;
    }
    log(`Starting to assign due time and duration for ${tasks.length} tasks.`);
    for (let task of tasks) {
      log(`Processing task: ${task.content} (Deadline: ${task.deadline ? task.deadline.date : "No deadline"})`);
      let timePrompt = new Prompt;
      timePrompt.title = "Assign Due Time and Duration";
      timePrompt.message = `Assign a due time and duration for:
"${task.content}"`;
      timePrompt.addDatePicker("dueTime", "Due Time", new Date, {
        mode: "time"
      });
      const durations = [
        "15 minutes",
        "30 minutes",
        "1 hour",
        "2 hours",
        "Custom"
      ];
      durations.forEach((duration) => timePrompt.addButton(duration));
      timePrompt.addButton("Skip");
      if (!timePrompt.show()) {
        log(`User skipped assigning due time/duration for "${task.content}"`);
        continue;
      }
      if (durations.includes(timePrompt.buttonPressed)) {
        let selectedDuration = timePrompt.buttonPressed;
        log(`User selected duration: ${selectedDuration}`);
        let dueTime = timePrompt.fieldValues["dueTime"];
        log(`Selected due time: ${dueTime}`);
        let dueDateTime = new Date;
        let [hours, minutes] = dueTime.toTimeString().split(" ")[0].split(":");
        dueDateTime.setHours(parseInt(hours));
        dueDateTime.setMinutes(parseInt(minutes));
        dueDateTime.setSeconds(0);
        let dueDateTimeRFC3339 = dueDateTime.toISOString();
        let updateOptions = {
          due_datetime: dueDateTimeRFC3339,
          due_string: `Today at ${hours}:${minutes}`
        };
        let success = await todoist.updateTask(task.id, updateOptions);
        if (!success) {
          log(`Failed to update due time for "${task.content}" - ${todoist.lastError}`, true);
          continue;
        }
        log(`Updated due time for task: "${task.content}"`);
        if (selectedDuration !== "Custom") {
          let [amount, unitText] = selectedDuration.split(" ");
          let unit = "minute";
          let durationAmount = parseInt(amount);
          if (unitText.startsWith("hour")) {
            durationAmount = durationAmount * 60;
          }
          let durationUpdate = {
            content: task.content,
            duration: {
              amount: durationAmount,
              unit
            }
          };
          let durationSuccess = await todoist.updateTask(task.id, durationUpdate);
          if (durationSuccess) {
            log(`Assigned duration: ${durationAmount} ${unit} to "${task.content}"`);
          } else {
            log(`Failed to assign duration to "${task.content}" - ${todoist.lastError}`, true);
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
                let unit = "minute";
                if (unitInput.startsWith("hour")) {
                  amount = amount * 60;
                } else if (unitInput.startsWith("day")) {
                  unit = "day";
                }
                let customDurationUpdate = {
                  content: task.content,
                  duration: {
                    amount,
                    unit
                  }
                };
                let customDurationSuccess = await todoist.updateTask(task.id, customDurationUpdate);
                if (customDurationSuccess) {
                  log(`Assigned custom duration: ${amount} ${unit} to "${task.content}"`);
                } else {
                  log(`Failed to assign custom duration to "${task.content}" - ${todoist.lastError}`, true);
                }
              } else {
                log(`Invalid custom duration format: "${customDurationInput}"`, true);
                showAlert("Invalid Duration", "Please enter in format like '45 minutes' or '2 hours'.");
              }
            } else {
              log(`User cancelled custom duration for "${task.content}"`);
            }
          }
        }
      } else if (timePrompt.buttonPressed === "Skip") {
        log(`User chose to skip task: "${task.content}"`);
        continue;
      } else {
        log(`Unhandled button pressed: ${timePrompt.buttonPressed}`, true);
      }
    }
  }
  async function handleDeadlineTasks() {
    log("Starting deadline tasks management...");
    log("Fetching all tasks...");
    let response = await todoist.request({
      url: "https://api.todoist.com/rest/v2/tasks",
      method: "GET"
    });
    if (!response.success) {
      log(`Failed to fetch tasks - Status code: ${response.statusCode}`, true);
      log(`Error: ${response.error}`);
      showAlert("Error", `Failed to fetch tasks from Todoist. Status code: ${response.statusCode}`);
      return;
    }
    let allTasks = response.responseData;
    log(`Successfully fetched ${allTasks.length} total tasks`);
    let today = new Date;
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let todayStr = today.toISOString().split("T")[0];
    let tomorrowStr = tomorrow.toISOString().split("T")[0];
    let deadlineTasks = allTasks.filter((task) => task.deadline && (task.deadline.date === todayStr || task.deadline.date === tomorrowStr));
    log(`Found ${deadlineTasks.length} tasks with deadlines for today or tomorrow`);
    if (deadlineTasks.length === 0) {
      log("No tasks with deadlines for today or tomorrow");
      showAlert("No Deadline Tasks", "No tasks with deadlines for today or tomorrow found.");
      return;
    }
    deadlineTasks.sort((a, b) => {
      if (!a.deadline || !b.deadline)
        return 0;
      return a.deadline.date.localeCompare(b.deadline.date);
    });
    for (let task of deadlineTasks) {
      log(`Processing task: "${task.content}" (Deadline: ${task.deadline.date})`);
      let taskPrompt = new Prompt;
      taskPrompt.title = "Manage Deadline Task";
      taskPrompt.message = `Task: "${task.content}"
Deadline: ${task.deadline.date} (${task.deadline.date === todayStr ? "Today" : "Tomorrow"})`;
      taskPrompt.addButton("Add Due Date");
      taskPrompt.addButton("Adjust Deadline");
      taskPrompt.addButton("Remove Deadline");
      taskPrompt.addButton("Complete Task");
      taskPrompt.addButton("Skip");
      if (!taskPrompt.show()) {
        log(`Skipped task: "${task.content}"`);
        continue;
      }
      let success = false;
      switch (taskPrompt.buttonPressed) {
        case "Add Due Date":
          success = await handleAddDueDate(task);
          break;
        case "Adjust Deadline":
          success = await handleAdjustDeadline(task);
          break;
        case "Remove Deadline":
          success = await handleRemoveDeadline(task);
          break;
        case "Complete Task":
          success = await todoist.closeTask(task.id);
          if (success) {
            log(`Completed task: "${task.content}"`);
          } else {
            log(`Failed to complete task: "${task.content}" - ${todoist.lastError}`, true);
          }
          break;
        case "Skip":
          log(`Skipped task: "${task.content}"`);
          continue;
      }
      if (!success && taskPrompt.buttonPressed !== "Complete Task") {
        log(`Failed to process task: "${task.content}"`, true);
      }
    }
    showAlert("Completed", "Finished managing deadline tasks.");
  }
  async function handleAddDueDate(task) {
    let timePrompt = new Prompt;
    timePrompt.title = "Add Due Date";
    timePrompt.message = `Set due date for:
"${task.content}"`;
    timePrompt.addButton("Same as Deadline");
    timePrompt.addButton("Day Before Deadline");
    timePrompt.addButton("Custom Date/Time");
    if (!timePrompt.show())
      return false;
    let updateOptions = { content: task.content };
    try {
      switch (timePrompt.buttonPressed) {
        case "Same as Deadline":
          updateOptions.due_date = task.deadline.date;
          break;
        case "Day Before Deadline":
          let beforeDate = new Date(task.deadline.date);
          beforeDate.setDate(beforeDate.getDate() - 1);
          updateOptions.due_date = beforeDate.toISOString().split("T")[0];
          break;
        case "Custom Date/Time":
          let customPrompt = new Prompt;
          customPrompt.addDatePicker("datetime", "Select Date and Time", new Date, { mode: "datetime" });
          if (!customPrompt.show())
            return false;
          let selectedDateTime = customPrompt.fieldValues["datetime"];
          updateOptions.due_datetime = selectedDateTime.toISOString();
          break;
      }
      let success = await todoist.updateTask(task.id, updateOptions);
      if (success) {
        log(`Updated due date for "${task.content}"`);
        return true;
      } else {
        log(`Failed to update due date for "${task.content}" - ${todoist.lastError}`, true);
        return false;
      }
    } catch (error) {
      log(`Error updating due date: ${error}`, true);
      return false;
    }
  }
  async function handleAdjustDeadline(task) {
    let datePrompt = new Prompt;
    datePrompt.title = "Adjust Deadline";
    datePrompt.message = `Current deadline: ${task.deadline.date}
Select new deadline:`;
    datePrompt.addButton("Tomorrow");
    datePrompt.addButton("Next Week");
    datePrompt.addButton("Custom Date");
    if (!datePrompt.show())
      return false;
    try {
      let newDeadline;
      switch (datePrompt.buttonPressed) {
        case "Tomorrow":
          let tomorrow = new Date;
          tomorrow.setDate(tomorrow.getDate() + 1);
          newDeadline = tomorrow.toISOString().split("T")[0];
          break;
        case "Next Week":
          let nextWeek = new Date;
          nextWeek.setDate(nextWeek.getDate() + 7);
          newDeadline = nextWeek.toISOString().split("T")[0];
          break;
        case "Custom Date":
          let customPrompt = new Prompt;
          customPrompt.addDatePicker("newDeadline", "Select New Deadline", new Date, { mode: "date" });
          if (!customPrompt.show())
            return false;
          let selectedDate = customPrompt.fieldValues["newDeadline"];
          newDeadline = selectedDate.toISOString().split("T")[0];
          break;
      }
      let updateOptions = {
        content: task.content,
        deadline: {
          date: newDeadline,
          lang: "en"
        }
      };
      let success = await todoist.updateTask(task.id, updateOptions);
      if (success) {
        log(`Updated deadline for "${task.content}" to ${newDeadline}`);
        return true;
      } else {
        log(`Failed to update deadline for "${task.content}" - ${todoist.lastError}`, true);
        return false;
      }
    } catch (error) {
      log(`Error adjusting deadline: ${error}`, true);
      return false;
    }
  }
  async function handleRemoveDeadline(task) {
    try {
      let updateOptions = {
        content: task.content,
        deadline: null
      };
      let success = await todoist.updateTask(task.id, updateOptions);
      if (success) {
        log(`Removed deadline from "${task.content}"`);
        return true;
      } else {
        log(`Failed to remove deadline from "${task.content}" - ${todoist.lastError}`, true);
        return false;
      }
    } catch (error) {
      log(`Error removing deadline: ${error}`, true);
      return false;
    }
  }
  async function handleAssignDuration(tasks) {
    if (tasks.length === 0) {
      showAlert("No Tasks", "No tasks found without a duration.");
      log("No tasks to assign duration.");
      return;
    }
    log(`Starting to assign durations for ${tasks.length} tasks.`);
    let remainingTasks = [...tasks];
    while (remainingTasks.length > 0) {
      let selectedTask = showTaskSelectionPrompt(remainingTasks);
      if (!selectedTask) {
        log("User cancelled the task selection prompt.");
        break;
      }
      log(`User selected task: "${selectedTask.content}"`);
      let assignSuccess = await assignDurationToTask(selectedTask);
      if (assignSuccess) {
        log(`Successfully assigned duration to "${selectedTask.content}"`);
      } else {
        log(`Failed to assign duration to "${selectedTask.content}"`, true);
      }
      remainingTasks = remainingTasks.filter((t) => t.id !== selectedTask.id);
    }
    log("Completed assigning durations.");
    showAlert("Completed", "Finished assigning durations.");
  }
  function showTaskSelectionPrompt(tasks) {
    log("Displaying task selection prompt...");
    let p = new Prompt;
    p.title = "Assign Duration";
    p.message = "Select a task to assign a duration:";
    let taskOptions = tasks.map((t) => `${t.content} (ID: ${t.id})`);
    p.addPicker("task", "Tasks", [taskOptions], [0]);
    p.addButton("Select");
    p.addButton("Cancel");
    if (p.show() && p.buttonPressed === "Select") {
      let selectedIndex = p.fieldValues["task"][0];
      let selectedTaskLabel = taskOptions[selectedIndex];
      log(`Selected Task Label: "${selectedTaskLabel}"`);
      log(`Selected Index: ${selectedIndex}`);
      if (typeof selectedTaskLabel === "string") {
        let idMatch = selectedTaskLabel.match(/\(ID:\s*(\d+)\)$/);
        if (idMatch) {
          let taskId = idMatch[1];
          let selectedTask = tasks.find((t) => t.id.toString() === taskId);
          if (selectedTask) {
            log(`Task selected: "${selectedTask.content}" with ID ${selectedTask.id}`);
            return selectedTask;
          } else {
            log(`Task ID "${taskId}" not found in tasks array.`, true);
            return null;
          }
        } else {
          log(`Could not extract ID from label: "${selectedTaskLabel}"`, true);
          return null;
        }
      } else {
        log(`Invalid selection type: ${typeof selectedTaskLabel}`, true);
        return null;
      }
    }
    log("User cancelled or closed the task selection prompt.");
    return null;
  }
  async function assignDurationToTask(task) {
    log(`Assigning duration to task: "${task.content}"`);
    let durationPrompt = new Prompt;
    durationPrompt.title = "Assign Duration";
    durationPrompt.message = `Assign a duration for:
"${task.content}"`;
    const durations = [
      "15 minutes",
      "30 minutes",
      "1 hour",
      "2 hours",
      "Custom"
    ];
    durations.forEach((d) => durationPrompt.addButton(d));
    durationPrompt.addButton("Skip");
    if (!durationPrompt.show()) {
      log(`User skipped assigning duration for "${task.content}"`);
      return false;
    }
    if (durations.includes(durationPrompt.buttonPressed)) {
      let selectedDuration = durationPrompt.buttonPressed;
      log(`User selected duration: ${selectedDuration}`);
      if (selectedDuration !== "Custom") {
        let [amount, unitText] = selectedDuration.split(" ");
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
}
