import { type Edit, applyEdits } from 'jsonc-parser';
import { type Emitter, getEmitter } from '../../common/emitter';
import type { GlobalEvents, IModelContentChangeEvent } from '../../common/emitter-events';
import { firstNonWhitespaceIndex, getLeadingWhitespace } from '../../common/strings';
import type { JSONModel } from '../../model/json-model';
import type { SelectionModel } from '../../model/selection-model';
import { type JsonWorkerManager, getJsonWorkerManager } from '../../worker/json-worker-manager';
import type { View } from '../view';
import { IndentAction, processJsonEnterAction } from './get-enter-action';
export class EditWidget {
    #view: View;
    #selectionModel: SelectionModel;
    #jsonModel: JSONModel;
    #isComposition: boolean = false;
    #autoClosingPairs: Record<string, string> = {
        '{': '}',
        '[': ']',
        '(': ')',
        '"': '"',
    };
    #emitter: Emitter<GlobalEvents> = getEmitter();
    #jsonWorkerManager: JsonWorkerManager;

    constructor(view: View, jsonModel: JSONModel, selectionModel: SelectionModel, jsonWorkerManager: JsonWorkerManager = getJsonWorkerManager()) {
        this.#jsonWorkerManager = jsonWorkerManager;
        this.#view = view;
        this.#jsonModel = jsonModel;
        this.#selectionModel = selectionModel;

        this.#attachEventListeners();
    }

    #attachEventListeners() {
        void this.#jsonWorkerManager.validate().then((result) => {
            this.#emitter.emit('problemsChanged', {
                problems: result.problems,
                root: result.root,
            });
        });

        this.#view.contentDom.addEventListener('beforeinput', (e: InputEvent) => {
            this.#handleBeforeInput(e);
        });

        this.#view.contentDom.addEventListener('compositionstart', (e: CompositionEvent) => {
            this.#handleCompositionStart(e);
        });

        this.#view.contentDom.addEventListener('compositionend', (e: CompositionEvent) => {
            this.#handleCompositionEnd(e);
        });

        this.#view.contentDom.addEventListener('keydown', (e: KeyboardEvent) => {
            this.#handleKeyDown(e);
        });

        this.#view.contentDom.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.#selectionModel.isSelecting = true;
            this.#selectionModel.updateFromSelectingStart();
        });

        this.#view.contentDom.addEventListener('mousemove', (e) => {
            if (!this.#selectionModel.isSelecting) return;
            if (e.button !== 0) return;
        });

        this.#view.contentDom.addEventListener('mouseup', (e) => {
            if (e.button !== 0) return;
            this.#selectionModel.updateFromSelectingEnd();
        });
    }

    #buildBaseOperation(type: IModelContentChangeEvent['type'] = 'insert') {
        let startRow = this.#selectionModel.startRow;
        let startCol = this.#selectionModel.startCol;
        let endRow = this.#selectionModel.endRow;
        let endCol = this.#selectionModel.endCol;

        const lineCount = this.#jsonModel.getLineCount();
        if (startRow > lineCount) {
            startRow = lineCount;
            startCol = this.#jsonModel.getLineLength(lineCount) + 1;
        }
        if (endRow > lineCount) {
            endRow = lineCount;
            endCol = this.#jsonModel.getLineLength(lineCount) + 1;
        }

        startRow = Math.max(1, startRow);
        startCol = Math.max(1, startCol);
        endRow = Math.max(1, endRow);
        endCol = Math.max(1, endCol);

        const startOffset = this.#jsonModel.getOffsetAt(startRow, startCol);
        const endOffset = this.#jsonModel.getOffsetAt(endRow, endCol);
        const op: IModelContentChangeEvent = {
            type,
            range: {
                startLineNumber: startRow,
                startColumn: startCol,
                endLineNumber: endRow,
                endColumn: endCol,
            },
            rangeOffset: startOffset,
            rangeLength: endOffset - startOffset,
            oldText: this.#jsonModel.getValueInRange({
                startLineNumber: startRow,
                startColumn: startCol,
                endLineNumber: endRow,
                endColumn: endCol,
            }),
            newText: '',
        };
        if (this.#selectionModel.isSelectedAll) {
            op.range = {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: this.#jsonModel.getLineCount(),
                endColumn: this.#jsonModel.getLineLength(this.#jsonModel.getLineCount()) + 1,
            };
            op.rangeOffset = 0;
            op.rangeLength = this.#jsonModel.getValue().length;
            op.oldText = this.#jsonModel.getValue();
        }
        return op;
    }

    #handleCompositionStart(e: CompositionEvent) {
        e.preventDefault();
        this.#isComposition = true;
        this.#selectionModel.savePreviousSelection();
    }

    #handleCompositionEnd(e: CompositionEvent) {
        e.preventDefault();
        this.#isComposition = false;
        this.#selectionModel.restorePreviousSelection();
        const op = this.#buildBaseOperation('replace');
        op.newText = e.data || '';
        this.#selectionModel.isSelectedAll = false;
        this.#jsonModel.applyOperation(op);
    }

    #handleBeforeInput(e: InputEvent) {
        if (this.#isComposition) return;
        e.preventDefault();
        if (!this.#selectionModel.isSelecting) {
            this.#selectionModel.updateFromSelection();
        }
        const op = this.#buildBaseOperation();
        const { startLineNumber, startColumn, endLineNumber, endColumn } = op.range;

        switch (e.inputType) {
            case 'insertText':
                if (this.#selectionModel.isCollapsed) {
                    op.type = 'insert';
                } else {
                    op.type = 'replace';
                }
                op.newText = e.data || '';
                if (this.#autoClosingPairs[op.newText]) {
                    op.newText += this.#autoClosingPairs[op.newText];
                    op.keepPosition = {
                        lineNumber: startLineNumber,
                        column: startColumn + 1,
                    };
                }
                break;
            case 'insertParagraph':
                op.newText = '\n';
                op.keepPosition = {
                    lineNumber: startLineNumber + 1,
                    column: 1,
                };
                const enterAction = processJsonEnterAction(this.#jsonModel, {
                    startLineNumber: startLineNumber,
                    startColumn: startColumn,
                    endLineNumber: endLineNumber,
                    endColumn: endColumn,
                });
                if (enterAction) {
                    if (enterAction.indentAction === IndentAction.Indent) {
                        op.newText = '\n' + this.#normalizeIndentation(enterAction.appendText + enterAction.indentation) || '';
                        op.keepPosition = {
                            lineNumber: startLineNumber + 1,
                            column: op.newText.length,
                        };
                    } else {
                        const normalIndent = this.#normalizeIndentation(enterAction.indentation);
                        const increasedIndent = this.#normalizeIndentation(enterAction.indentation + enterAction.appendText);
                        op.newText = '\n' + increasedIndent + '\n' + normalIndent;
                        op.keepPosition = {
                            lineNumber: startLineNumber + 1,
                            column: increasedIndent.length + 1,
                        };
                    }
                } else {
                    const lineText = this.#jsonModel.getLineContent(startLineNumber);
                    const indentation = getLeadingWhitespace(lineText).substring(0, startColumn - 1);
                    op.newText = '\n' + this.#normalizeIndentation(indentation) || '';
                    op.keepPosition = {
                        lineNumber: startLineNumber + 1,
                        column: op.newText.length,
                    };
                }
                break;
            case 'deleteContentBackward':
                if (this.#jsonModel.isStartPosition() && this.#selectionModel.isCollapsed) {
                    return;
                }
                if (this.#selectionModel.isCollapsed) {
                    op.rangeOffset -= 1;
                    op.oldText = this.#jsonModel.getValueInRange({
                        startLineNumber: startLineNumber,
                        startColumn: startColumn - 1,
                        endLineNumber: endLineNumber,
                        endColumn: endColumn,
                    });
                }
                op.type = 'delete';
                op.rangeLength = op.oldText.length;
                break;
            case 'insertFromPaste':
                const pasteData = e.dataTransfer?.getData('text/plain');
                op.type = 'replace';
                op.newText = pasteData || '';
                break;
        }
        this.#selectionModel.isSelectedAll = false;
        this.#selectionModel.isSelecting = false;

        this.#jsonModel.applyOperation(op);
    }

    #normalizeIndentation(str: string) {
        const indentSize = this.#view.options?.formatOptions?.tabSize || 4;
        const insertSpaces = !!this.#view.options?.formatOptions?.insertSpaces;
        let firstIndex = firstNonWhitespaceIndex(str);
        if (firstIndex === -1) {
            firstIndex = str.length;
        }
        return this.#normalizeIndentationFromWhitespace(str.substring(0, firstIndex), indentSize, insertSpaces) + str.substring(firstIndex);
    }

    #normalizeIndentationFromWhitespace(str: string, indentSize: number, insertSpaces: boolean) {
        let spacesCnt = 0;
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) === '\t') {
                spacesCnt = this.#nextIndentTabStop(spacesCnt, indentSize);
            } else {
                spacesCnt++;
            }
        }

        let result = '';
        if (!insertSpaces) {
            const tabsCnt = Math.floor(spacesCnt / indentSize);
            spacesCnt = spacesCnt % indentSize;
            for (let i = 0; i < tabsCnt; i++) {
                result += '\t';
            }
        }

        for (let i = 0; i < spacesCnt; i++) {
            result += ' ';
        }

        return result;
    }

    #nextIndentTabStop(spacesCnt: number, indentSize: number) {
        return spacesCnt + indentSize - (spacesCnt % indentSize);
    }

    #handleKeyDown(e: KeyboardEvent) {
        if (!this.#selectionModel.isSelecting) {
            this.#selectionModel.updateFromSelection();
        }
        const op = this.#buildBaseOperation();
        const isCtrl = e.ctrlKey || e.metaKey;
        switch (e.code) {
            case 'Tab':
                if (this.#view.completeWidget.isVisible) {
                    e.preventDefault();
                    this.#view.completeWidget.handleKeyDown(e);
                    return;
                }
                e.preventDefault();
                let insertText = '';

                if (this.#view.options?.formatOptions?.insertSpaces) {
                    const tabSize = this.#view.options?.formatOptions?.tabSize || 4;
                    for (let i = 0; i < tabSize; i++) {
                        insertText += ' ';
                    }
                } else {
                    insertText = '\t';
                }
                op.newText = insertText;
                this.#jsonModel.applyOperation(op);
                break;
            case 'KeyF':
                if (e.shiftKey && isCtrl) {
                    e.preventDefault();
                    this.format();
                }
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
                if (this.#view.completeWidget.isVisible) {
                    this.#view.completeWidget.hide();
                }
                break;
            case 'ArrowDown':
            case 'ArrowUp':
                if (this.#view.completeWidget.isVisible) {
                    e.preventDefault();
                    this.#view.completeWidget.handleKeyDown(e);
                }
                break;
            case 'Enter':
                if (this.#view.completeWidget.isVisible) {
                    e.preventDefault();
                    this.#view.completeWidget.handleKeyDown(e);
                }
                break;
            case 'KeyA':
                if (isCtrl) {
                    this.#selectionModel.isSelectedAll = true;
                }
                break;
            case 'KeyX':
                if (isCtrl) {
                    e.preventDefault();
                    void this.#cutHandler();
                }
                break;
            case 'KeyZ':
                if (isCtrl && !e.shiftKey) {
                    e.preventDefault();
                    this.#jsonModel.undo();
                } else if (isCtrl && e.shiftKey) {
                    e.preventDefault();
                    this.#jsonModel.redo();
                }
                break;
            case 'KeyC':
                if (isCtrl) {
                    e.preventDefault();
                    this.#copyHandler();
                }
                break;
        }
    }

    async #cutHandler() {
        const op = this.#buildBaseOperation('replace');
        if (this.#selectionModel.isCollapsed) {
            const { startLineNumber, endLineNumber } = op.range;
            op.rangeOffset = this.#jsonModel.getOffsetAt(startLineNumber, 1);
            op.oldText = this.#jsonModel.getValueInRange({
                startLineNumber,
                startColumn: 1,
                endLineNumber,
                endColumn: this.#jsonModel.getLineLength(endLineNumber) + 1,
            });
            op.range = {
                startLineNumber,
                startColumn: 1,
                endLineNumber,
                endColumn: this.#jsonModel.getLineLength(endLineNumber) + 1,
            };
        }
        // the text is only deleted once it is on the clipboard; a failed write rejects and keeps it
        await navigator.clipboard.writeText(op.oldText);
        this.#jsonModel.applyOperation(op);
    }

    #copyHandler() {
        const op = this.#buildBaseOperation('replace');
        void navigator.clipboard.writeText(op.oldText);
    }

    format() {
        void this.#jsonWorkerManager
            .formatJson(
                this.#view.options?.formatOptions || {
                    tabSize: 2,
                    insertSpaces: true,
                }
            )
            .then((edits: Edit[]) => {
                const newValue = applyEdits(this.#jsonModel.getValue(), edits);
                const op: IModelContentChangeEvent = {
                    type: 'replace',
                    range: {
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: this.#jsonModel.getLineCount(),
                        endColumn: this.#jsonModel.getLineLength(this.#jsonModel.getLineCount()) + 1,
                    },
                    rangeOffset: 0,
                    rangeLength: this.#jsonModel.getValue().length,
                    oldText: this.#jsonModel.getValue(),
                    newText: newValue,
                };
                this.#jsonModel.applyOperation(op);
            });
    }
}
