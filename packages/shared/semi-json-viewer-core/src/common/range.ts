/** based on https://github.com/microsoft/vscode with modifications for custom requirements */

import { type IPosition, Position } from './position';

export interface IRange {
    /** Line and column numbers start at 1. */
    readonly startLineNumber: number;
    readonly startColumn: number;
    readonly endLineNumber: number;
    readonly endColumn: number;
}

/** (startLineNumber,startColumn) is always <= (endLineNumber,endColumn) */
export class Range {
    readonly startLineNumber: number;
    readonly startColumn: number;
    readonly endLineNumber: number;
    readonly endColumn: number;

    constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number) {
        if (startLineNumber > endLineNumber || (startLineNumber === endLineNumber && startColumn > endColumn)) {
            this.startLineNumber = endLineNumber;
            this.startColumn = endColumn;
            this.endLineNumber = startLineNumber;
            this.endColumn = startColumn;
        } else {
            this.startLineNumber = startLineNumber;
            this.startColumn = startColumn;
            this.endLineNumber = endLineNumber;
            this.endColumn = endColumn;
        }
    }

    static create(start: IPosition, end: IPosition) {
        return new Range(start.lineNumber, start.column, end.lineNumber, end.column);
    }

    /** Touching ranges count as intersecting. */
    static areIntersecting(a: IRange, b: IRange) {
        if (a.endLineNumber < b.startLineNumber || (a.endLineNumber === b.startLineNumber && a.endColumn <= b.startColumn)) {
            return false;
        }

        if (b.endLineNumber < a.startLineNumber || (b.endLineNumber === a.startLineNumber && b.endColumn <= a.startColumn)) {
            return false;
        }

        return true;
    }

    static plusRange(a: IRange, b: IRange) {
        let startLineNumber: number;
        let startColumn: number;
        let endLineNumber: number;
        let endColumn: number;

        if (b.startLineNumber < a.startLineNumber) {
            startLineNumber = b.startLineNumber;
            startColumn = b.startColumn;
        } else if (b.startLineNumber === a.startLineNumber) {
            startLineNumber = b.startLineNumber;
            startColumn = Math.min(b.startColumn, a.startColumn);
        } else {
            startLineNumber = a.startLineNumber;
            startColumn = a.startColumn;
        }

        if (b.endLineNumber > a.endLineNumber) {
            endLineNumber = b.endLineNumber;
            endColumn = b.endColumn;
        } else if (b.endLineNumber === a.endLineNumber) {
            endLineNumber = b.endLineNumber;
            endColumn = Math.max(b.endColumn, a.endColumn);
        } else {
            endLineNumber = a.endLineNumber;
            endColumn = a.endColumn;
        }

        return new Range(startLineNumber, startColumn, endLineNumber, endColumn);
    }

    static getStartPosition(range: IRange) {
        return new Position(range.startLineNumber, range.startColumn);
    }

    plusRange(range: IRange) {
        return Range.plusRange(this, range);
    }

    getStartPosition() {
        return Range.getStartPosition(this);
    }
}
