import { getLineElement } from '../common/dom';
import type { Position } from '../common/position';
import type { View } from '../view/view';
import type { JSONModel } from './json-model';

export class SelectionModel {
    #row: number;
    #col: number;
    #view: View;
    #jsonModel: JSONModel;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
    preStartRow: number;
    preStartCol: number;
    preEndRow: number;
    preEndCol: number;
    isCollapsed: boolean;
    isSelectedAll: boolean = false;
    isSelecting: boolean = false;

    constructor(row: number, col: number, view: View, jsonModel: JSONModel) {
        this.#row = row;
        this.#col = col;
        this.#view = view;
        this.startRow = row;
        this.startCol = col;
        this.endRow = row;
        this.endCol = col;
        this.isCollapsed = true;
        this.#jsonModel = jsonModel;
    }

    #getValidSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !selection.anchorNode || !selection.focusNode) {
            return null;
        }
        return selection;
    }

    #setSelection(startRow: number, startCol: number, endRow: number, endCol: number) {
        this.#row = startRow;
        this.#col = startCol;
        this.startRow = startRow;
        this.startCol = startCol;
        this.endRow = endRow;
        this.endCol = endCol;
    }

    /**
     * Restore multi-selection (non-collapsed selection) after DOM re-render
     */
    #restoreMultiSelection(selection: Selection) {
        const firstVisibleLineElement = this.#view.scrollDom.firstElementChild as HTMLElement | null;
        const lastVisibleLineElement = this.#view.scrollDom.lastElementChild as HTMLElement | null;

        if (!firstVisibleLineElement || !lastVisibleLineElement) {
            selection.removeAllRanges();
            return;
        }

        const startLineElement = this.#view.getLineElement(this.startRow);
        const endLineElement = this.#view.getLineElement(this.endRow);
        const firstVisibleLineNumber = Number(firstVisibleLineElement.dataset.lineNumber || 0);
        const lastVisibleLineNumber = Number(lastVisibleLineElement.dataset.lineNumber || 0);

        const isSelectionAboveViewport = this.endRow < firstVisibleLineNumber;
        const isSelectionBelowViewport = this.startRow > lastVisibleLineNumber;

        // keep browser selection constrained inside JsonViewer
        if (isSelectionAboveViewport) {
            const range = new Range();
            range.setStartBefore(firstVisibleLineElement);
            range.setEndBefore(firstVisibleLineElement);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }

        // keep browser selection constrained inside JsonViewer
        if (isSelectionBelowViewport) {
            const range = new Range();
            range.setStartAfter(lastVisibleLineElement);
            range.setEndAfter(lastVisibleLineElement);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }

        const range = new Range();

        if (startLineElement) {
            const startPos = this.#findPositionInLine(startLineElement, this.startCol - 1);
            if (startPos) {
                range.setStart(startPos.node, startPos.offset);
            } else {
                range.setStart(startLineElement, 0);
            }
        } else {
            range.setStartBefore(firstVisibleLineElement);
        }

        if (endLineElement) {
            const endPos = this.#findPositionInLine(endLineElement, this.endCol - 1);
            if (endPos) {
                range.setEnd(endPos.node, endPos.offset);
            } else {
                const lastChild = endLineElement.lastChild;
                if (lastChild) {
                    if (lastChild.nodeType === Node.TEXT_NODE) {
                        range.setEnd(lastChild, lastChild.textContent?.length || 0);
                    } else {
                        range.setEnd(endLineElement, endLineElement.childNodes.length);
                    }
                }
            }
        } else {
            range.setEndAfter(lastVisibleLineElement);
        }

        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Find the text node and offset for a given column position in a line element
     */
    #findPositionInLine(lineElement: HTMLElement, col: number) {
        if (col === 0) {
            const walker = document.createTreeWalker(lineElement, NodeFilter.SHOW_TEXT, null);
            const firstNode = walker.nextNode() as Text;
            if (firstNode) {
                return { node: firstNode, offset: 0 };
            }
            return null;
        }

        const walker = document.createTreeWalker(lineElement, NodeFilter.SHOW_TEXT, null);
        let node: Text | null = walker.nextNode() as Text;
        let currentOffset = 0;

        while (node) {
            const nodeLength = node.length;
            if (currentOffset + nodeLength >= col) {
                return { node, offset: col - currentOffset };
            }
            currentOffset += nodeLength;
            node = walker.nextNode() as Text;
        }

        walker.currentNode = lineElement;
        let lastNode: Text | null = null;
        while (walker.nextNode()) {
            lastNode = walker.currentNode as Text;
        }
        if (lastNode) {
            return { node: lastNode, offset: lastNode.length };
        }

        return null;
    }

    updateSelection(row: number, col: number) {
        this.#row = row;
        this.#col = col;
    }

    getSelection() {
        return {
            row: this.#row,
            col: this.#col,
        };
    }

    getPosition(): Position {
        return {
            lineNumber: this.#row,
            column: this.#col,
        };
    }

    updateFromSelection() {
        const selection = this.#getValidSelection();
        if (!selection) return;
        this.isCollapsed = selection.isCollapsed;
        const startContainer = selection.anchorNode;
        const endContainer = selection.focusNode;

        let { row: row1, col: col1 } = this.convertRangeToModelPosition(startContainer, selection, true);
        let { row: row2, col: col2 } = this.convertRangeToModelPosition(endContainer, selection, false);
        // Backward selections report focus before anchor; normalize to start <= end.
        if (row1 > row2 || (row1 === row2 && col1 > col2)) {
            [row1, row2] = [row2, row1];
            [col1, col2] = [col2, col1];
        }
        this.#setSelection(row1, col1, row2, col2);
        this.#jsonModel.lastChangeBufferPos = {
            lineNumber: this.#row,
            column: this.#col,
        };
    }

    /** Updates only the start point, used while dragging a selection. */
    updateFromSelectingStart() {
        const selection = this.#getValidSelection();
        if (!selection) return;
        this.isCollapsed = selection.isCollapsed;
        const startContainer = selection.anchorNode;
        let { row, col } = this.convertRangeToModelPosition(startContainer, selection, true);
        this.#setSelection(row, col, this.endRow, this.endCol);
    }

    /** Updates only the end point, used while dragging a selection. */
    updateFromSelectingEnd() {
        const selection = this.#getValidSelection();
        if (!selection) return;
        this.isCollapsed = selection.isCollapsed;
        const endContainer = selection.focusNode;
        let { row, col } = this.convertRangeToModelPosition(endContainer, selection, false);
        this.#setSelection(this.startRow, this.startCol, row, col);
        this.#jsonModel.lastChangeBufferPos = {
            lineNumber: this.#row,
            column: this.#col,
        };
    }

    toViewPosition() {
        const selection = window.getSelection();
        if (!selection) return;

        if (this.isSelectedAll) {
            const firstChild = this.#view.scrollDom.firstChild;
            const lastChild = this.#view.scrollDom.lastChild;

            if (!firstChild || !lastChild) {
                selection.removeAllRanges();
                return;
            }

            const range = new Range();
            range.setStartBefore(firstChild);
            range.setEndAfter(lastChild);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }

        if (!this.isCollapsed) {
            this.#restoreMultiSelection(selection);
            return;
        }

        const row = this.#jsonModel.lastChangeBufferPos.lineNumber;
        const col = this.#jsonModel.lastChangeBufferPos.column - 1;
        const firstVisibleLineElement = this.#view.scrollDom.firstElementChild as HTMLElement | null;
        const lastVisibleLineElement = this.#view.scrollDom.lastElementChild as HTMLElement | null;

        if (!firstVisibleLineElement || !lastVisibleLineElement) {
            selection.removeAllRanges();
            return;
        }

        const lineElement = this.#view.getLineElement(row);

        const range = new Range();

        if (!lineElement) {
            const firstVisibleLineNumber = Number(firstVisibleLineElement.dataset.lineNumber || 0);
            const lastVisibleLineNumber = Number(lastVisibleLineElement.dataset.lineNumber || 0);

            if (row < firstVisibleLineNumber) {
                range.setStartBefore(firstVisibleLineElement);
                range.setEndBefore(firstVisibleLineElement);
            } else if (row > lastVisibleLineNumber) {
                range.setStartAfter(lastVisibleLineElement);
                range.setEndAfter(lastVisibleLineElement);
            } else {
                selection.removeAllRanges();
                return;
            }
        } else {
            const position = this.#findPositionInLine(lineElement, col);

            if (position) {
                range.setStart(position.node, position.offset);
                range.setEnd(position.node, position.offset);
            } else {
                range.setStart(lineElement, 0);
                range.setEnd(lineElement, 0);
            }
        }

        selection.removeAllRanges();
        selection.addRange(range);
    }

    toLastPosition() {
        this.isCollapsed = true;
        this.isSelectedAll = false;
        const lineCount = this.#jsonModel.getLineCount();
        const lineLength = this.#jsonModel.getLineLength(lineCount);
        this.#row = lineCount;
        this.#col = lineLength + 1;
        this.startRow = lineCount;
        this.startCol = lineLength + 1;
        this.endRow = lineCount;
        this.endCol = lineLength + 1;
        this.#jsonModel.lastChangeBufferPos = {
            lineNumber: lineCount,
            column: lineLength + 1,
        };
        this.toViewPosition();
    }

    convertRangeToModelPosition(node: Node, selection: Selection, isStart: boolean) {
        let row = 1;
        let col = 0;
        if (!node) return { row, col };

        let lineElement: HTMLElement | null;
        if (node instanceof HTMLElement) {
            lineElement = node.closest(`.${this.#view.prefixCls}-view-line`);
        } else {
            lineElement = getLineElement(node);
            if (!lineElement) return { row, col };

            const walker = document.createTreeWalker(lineElement, NodeFilter.SHOW_TEXT, null);

            let currentNode: Text | null = walker.nextNode() as Text;
            let totalOffset = 0;

            while (currentNode) {
                if (currentNode === node) {
                    totalOffset += isStart ? selection.anchorOffset : selection.focusOffset;
                    break;
                }
                if (currentNode.parentNode === node.parentNode) {
                    if (currentNode === node) {
                        totalOffset += isStart ? selection.anchorOffset : selection.focusOffset;
                        break;
                    }
                }

                totalOffset += currentNode.length;
                currentNode = walker.nextNode() as Text;
            }

            col = totalOffset;
        }
        row = Number(lineElement?.dataset.lineNumber) || 1;
        return { row, col: col + 1 };
    }

    savePreviousSelection() {
        this.preStartRow = this.startRow;
        this.preStartCol = this.startCol;
        this.preEndRow = this.endRow;
        this.preEndCol = this.endCol;
    }

    restorePreviousSelection() {
        this.startRow = this.preStartRow;
        this.startCol = this.preStartCol;
        this.endRow = this.preEndRow;
        this.endCol = this.preEndCol;
        this.#jsonModel.lastChangeBufferPos = {
            lineNumber: this.startRow,
            column: this.startCol,
        };
    }
}
