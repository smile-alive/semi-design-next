import { type Emitter, getEmitter } from '../common/emitter';
import type { GlobalEvents, IModelContentChangeEvent } from '../common/emitter-events';
import { type FindMatch, type SearchData, EndOfLinePreference } from '../common/model';
import { type IRange, Range } from '../common/range';
import { isInWorkerThread } from '../common/worker';
import { type PieceTreeBase, DefaultEndOfLine, PieceTreeTextBufferBuilder } from '../piece-tree-text-buffer';
import { type JsonWorkerManager, getJsonWorkerManager } from '../worker/json-worker-manager';
import { type Command, DeleteCommand, InsertCommand, MultiCommand, ReplaceCommand } from './command';
import { SearchParams, TextModelSearch } from './text-model-search';

export class JSONModel {
    #pieceTree: PieceTreeBase;
    #normalizeEOL: boolean;
    #undoStack: Command[] = [];
    #redoStack: Command[] = [];
    readonly #MAX_STACK_SIZE = 20;
    #jsonWorkerManager: JsonWorkerManager | null = null;
    #emitter: Emitter<GlobalEvents> | null = null;
    lastChangeBufferPos = {
        lineNumber: 1,
        column: 1,
    };

    constructor(value: string, normalizeEOL: boolean = true) {
        this.#normalizeEOL = normalizeEOL;
        this.#pieceTree = this.createTextBuffer(value);
        if (!isInWorkerThread()) {
            this.#jsonWorkerManager = getJsonWorkerManager();
            this.#emitter = getEmitter();
        }
    }

    #createCommand(op: IModelContentChangeEvent | IModelContentChangeEvent[]): Command {
        if (Array.isArray(op)) {
            return new MultiCommand(this, op);
        }
        switch (op.type) {
            case 'insert':
                return new InsertCommand(this, op);
            case 'delete':
                return new DeleteCommand(this, op);
            case 'replace':
                return new ReplaceCommand(this, op);
            default:
                throw new Error('Unknown operation type');
        }
    }

    #getEndOfLine(eol: EndOfLinePreference): string {
        switch (eol) {
            case EndOfLinePreference.LF:
                return '\n';
            case EndOfLinePreference.CRLF:
                return '\r\n';
            case EndOfLinePreference.TextDefined:
                return this.getEOL();
            default:
                throw new Error('Unknown EOL preference');
        }
    }

    get pieceTree() {
        return this.#pieceTree;
    }

    createTextBufferFactory(value: string) {
        const builder = new PieceTreeTextBufferBuilder();
        builder.acceptChunk(value);
        return builder.finish(this.#normalizeEOL);
    }

    createTextBuffer(value: string) {
        return this.createTextBufferFactory(value).create(DefaultEndOfLine.LF);
    }

    getLineCount() {
        return this.#pieceTree.getLineCount();
    }

    getLineContent(lineNumber: number) {
        return this.#pieceTree.getLineContent(lineNumber);
    }

    getLineLength(lineNumber: number) {
        return this.#pieceTree.getLineLength(lineNumber);
    }

    getOffsetAt(lineNumber: number, column: number) {
        return this.#pieceTree.getOffsetAt(lineNumber, column);
    }

    positionAt(offset: number) {
        offset = Math.min(this.#pieceTree.getLength(), Math.max(0, offset));
        return this.#pieceTree.getPositionAt(offset);
    }

    applyOperation(op: IModelContentChangeEvent | IModelContentChangeEvent[]) {
        this.#redoStack = [];
        const command = this.#createCommand(op);
        this.pushUndoStack(command);
        command.execute();

        if (!isInWorkerThread()) {
            this.#emitter?.emit('contentChanged', op);
        }
        if (this.#jsonWorkerManager) {
            void this.#jsonWorkerManager
                .updateModel(op)
                .then(() => {
                    return this.#jsonWorkerManager?.validate();
                })
                .then((result) => {
                    this.#emitter?.emit('problemsChanged', {
                        problems: result.problems,
                        root: result.root,
                    });
                });
        }
    }

    updateLastChangeBufferPos(op: IModelContentChangeEvent) {
        if (op.keepPosition) {
            this.lastChangeBufferPos = op.keepPosition;
            return;
        }

        const getEndPosition = (startLineNumber: number, startColumn: number, text: string) => {
            const parts = text.split(/\r\n|\r|\n/);
            const lineBreakCount = parts.length - 1;

            if (lineBreakCount === 0) {
                return {
                    lineNumber: startLineNumber,
                    column: startColumn + text.length,
                };
            }

            return {
                lineNumber: startLineNumber + lineBreakCount,
                column: parts[parts.length - 1].length + 1,
            };
        };

        switch (op.type) {
            case 'insert':
                this.lastChangeBufferPos = getEndPosition(op.range.startLineNumber, op.range.startColumn, op.newText);
                break;
            case 'delete':
                if (this.lastChangeBufferPos.column === 1) {
                    this.lastChangeBufferPos.lineNumber -= 1;
                    this.lastChangeBufferPos.column = this.getLineLength(this.lastChangeBufferPos.lineNumber) + 1;
                } else {
                    const startColumn = op.range.startColumn;
                    const newColumn = op.rangeLength === 1 ? startColumn - 1 : startColumn;
                    this.lastChangeBufferPos.column = newColumn;
                }
                break;
            case 'replace':
                this.lastChangeBufferPos = getEndPosition(op.range.startLineNumber, op.range.startColumn, op.newText);
                break;
        }
    }

    pushUndoStack(command: Command) {
        this.#undoStack.push(command);
        if (this.#undoStack.length > this.#MAX_STACK_SIZE) {
            this.#undoStack.shift();
        }
    }

    pushRedoStack(command: Command) {
        this.#redoStack.push(command);
        if (this.#redoStack.length > this.#MAX_STACK_SIZE) {
            this.#redoStack.shift();
        }
    }

    canUndo() {
        return this.#undoStack.length > 0;
    }

    canRedo() {
        return this.#redoStack.length > 0;
    }

    undo() {
        if (!this.canUndo()) return;

        const command = this.#undoStack.pop();
        command.undo();
        this.#redoStack.push(command);
        if (!isInWorkerThread()) {
            this.#emitter?.emit('contentChanged', command.operation);
        }
        if (this.#jsonWorkerManager) {
            void this.#jsonWorkerManager
                .undo()
                .then(() => {
                    return this.#jsonWorkerManager?.validate();
                })
                .then((result) => {
                    this.#emitter?.emit('problemsChanged', {
                        problems: result.problems,
                        root: result.root,
                    });
                });
        }
    }

    redo() {
        if (!this.canRedo()) return;

        const command = this.#redoStack.pop();
        command.execute();
        this.#undoStack.push(command);
        if (!isInWorkerThread()) {
            this.#emitter?.emit('contentChanged', command.operation);
        }
        if (this.#jsonWorkerManager) {
            void this.#jsonWorkerManager
                .redo()
                .then(() => {
                    return this.#jsonWorkerManager?.validate();
                })
                .then((result) => {
                    this.#emitter?.emit('problemsChanged', {
                        problems: result.problems,
                        root: result.root,
                    });
                });
        }
    }

    getValue() {
        return this.#pieceTree.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: this.#pieceTree.getLineCount(),
            endColumn: this.#pieceTree.getLineContent(this.#pieceTree.getLineCount()).length + 1,
        });
    }

    setValue(value: string) {
        const builder = new PieceTreeTextBufferBuilder();
        builder.acceptChunk(value);
        this.#pieceTree = builder.finish(this.#normalizeEOL).create(1);
    }

    getEOL() {
        return this.#pieceTree.getEOL();
    }

    getValueInRange(range: IRange, eol: EndOfLinePreference = EndOfLinePreference.TextDefined) {
        return this.#pieceTree.getValueInRange(range, this.#getEndOfLine(eol));
    }

    getFullModelRange() {
        const lineCount = this.getLineCount();
        return new Range(1, 1, lineCount, this.getLineLength(lineCount) + 1);
    }

    findMatchesLineByLine(searchRange: Range, searchData: SearchData, captureMatches: boolean, limitResultCount: number) {
        return this.#pieceTree.findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount);
    }

    /** Based on https://github.com/microsoft/vscode with modifications for custom requirements */
    findMatches(searchString: string, _rawSearchScope: unknown, isRegex: boolean, matchCase: boolean, wordSeparators: string | null, captureMatches: boolean, limitResultCount: number = Infinity) {
        let searchRanges: Range[] | null = null;

        if (searchRanges === null) {
            searchRanges = [this.getFullModelRange()];
        }

        searchRanges = searchRanges.toSorted((d1, d2) => d1.startLineNumber - d2.startLineNumber || d1.startColumn - d2.startColumn);

        const uniqueSearchRanges: Range[] = [];
        uniqueSearchRanges.push(
            searchRanges.reduce((prev, curr) => {
                if (Range.areIntersecting(prev, curr)) {
                    return prev.plusRange(curr);
                }

                uniqueSearchRanges.push(prev);
                return curr;
            })
        );

        let matchMapper: (value: Range, index: number, array: Range[]) => FindMatch[];
        if (!isRegex && searchString.indexOf('\n') < 0) {
            const searchParams = new SearchParams(searchString, isRegex, matchCase, wordSeparators);
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return [];
            }

            matchMapper = (searchRange: Range) => this.findMatchesLineByLine(searchRange, searchData, captureMatches, limitResultCount);
        } else {
            matchMapper = (searchRange: Range) => TextModelSearch.findMatches(this, new SearchParams(searchString, isRegex, matchCase, wordSeparators), searchRange, captureMatches, limitResultCount);
        }
        return uniqueSearchRanges.map(matchMapper).reduce((arr, matches: FindMatch[]) => arr.concat(matches), []);
    }

    isStartPosition() {
        const { lineNumber, column } = this.lastChangeBufferPos;
        return lineNumber === 1 && column === 1;
    }
}
