/** based on https://github.com/microsoft/vscode with modifications for custom requirements */

export interface IPosition {
    /** starts at 1 */
    readonly lineNumber: number;
    /** the first character in a line is between column 1 and column 2 */
    readonly column: number;
}

export class Position {
    readonly lineNumber: number;
    readonly column: number;

    constructor(lineNumber: number, column: number) {
        this.lineNumber = lineNumber;
        this.column = column;
    }
}
