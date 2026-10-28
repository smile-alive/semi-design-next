/** reference from https://github.com/microsoft/vscode */

import { CharCode } from '../common/charCode';
import { StringBuffer, createLineStarts, createLineStartsFast, PieceTreeBase } from './pieceTreeBase';

export const UTF8_BOM_CHARACTER = String.fromCharCode(CharCode.UTF8_BOM);

export function startsWithUTF8BOM(str: string) {
    return !!(str && str.length > 0 && str.charCodeAt(0) === CharCode.UTF8_BOM);
}

export const enum DefaultEndOfLine {
    /**
     * Use line feed (\n) as the end of line character.
     */
    LF = 1,
    /**
     * Use carriage return and line feed (\r\n) as the end of line character.
     */
    CRLF = 2,
}

export class PieceTreeTextBufferFactory {
    readonly #chunks: StringBuffer[];
    readonly #cr: number;
    readonly #lf: number;
    readonly #crlf: number;
    readonly #normalizeEOL: boolean;

    constructor(_chunks: StringBuffer[], _cr: number, _lf: number, _crlf: number, _normalizeEOL: boolean) {
        this.#chunks = _chunks;
        this.#cr = _cr;
        this.#lf = _lf;
        this.#crlf = _crlf;
        this.#normalizeEOL = _normalizeEOL;
    }

    #getEOL(defaultEOL: DefaultEndOfLine) {
        const totalEOLCount = this.#cr + this.#lf + this.#crlf;
        const totalCRCount = this.#cr + this.#crlf;
        if (totalEOLCount === 0) {
            return defaultEOL === DefaultEndOfLine.LF ? '\n' : '\r\n';
        }
        if (totalCRCount > totalEOLCount / 2) {
            return '\r\n';
        }
        return '\n';
    }

    create(defaultEOL: DefaultEndOfLine) {
        const eol = this.#getEOL(defaultEOL);
        const chunks = this.#chunks;

        if (this.#normalizeEOL && ((eol === '\r\n' && (this.#cr > 0 || this.#lf > 0)) || (eol === '\n' && (this.#cr > 0 || this.#crlf > 0)))) {
            for (let i = 0, len = chunks.length; i < len; i++) {
                const str = chunks[i].buffer.replace(/\r\n|\r|\n/g, eol);
                const newLineStart = createLineStartsFast(str);
                chunks[i] = new StringBuffer(str, newLineStart);
            }
        }

        return new PieceTreeBase(chunks, eol, this.#normalizeEOL);
    }

    getFirstLineText(_lengthLimit: number) {
        return this.#chunks[0].buffer.slice(0, 100).split(/\r\n|\r|\n/)[0];
    }
}

export class PieceTreeTextBufferBuilder {
    readonly #chunks: StringBuffer[];

    #hasPreviousChar: boolean;
    #previousChar: number;
    readonly #tmpLineStarts: number[];

    #cr: number;
    #lf: number;
    #crlf: number;

    constructor() {
        this.#chunks = [];

        this.#hasPreviousChar = false;
        this.#previousChar = 0;
        this.#tmpLineStarts = [];

        this.#cr = 0;
        this.#lf = 0;
        this.#crlf = 0;
    }

    #acceptChunk1(chunk: string, allowEmptyStrings: boolean) {
        if (!allowEmptyStrings && chunk.length === 0) {
            return;
        }

        if (this.#hasPreviousChar) {
            this.#acceptChunk2(String.fromCharCode(this.#previousChar) + chunk);
        } else {
            this.#acceptChunk2(chunk);
        }
    }

    #acceptChunk2(chunk: string) {
        const lineStarts = createLineStarts(this.#tmpLineStarts, chunk);

        this.#chunks.push(new StringBuffer(chunk, lineStarts.lineStarts));
        this.#cr += lineStarts.cr;
        this.#lf += lineStarts.lf;
        this.#crlf += lineStarts.crlf;
    }

    #finish() {
        if (this.#chunks.length === 0) {
            this.#acceptChunk1('', true);
        }

        if (this.#hasPreviousChar) {
            this.#hasPreviousChar = false;
            const lastChunk = this.#chunks[this.#chunks.length - 1];
            lastChunk.buffer += String.fromCharCode(this.#previousChar);
            const newLineStarts = createLineStartsFast(lastChunk.buffer);
            lastChunk.lineStarts = newLineStarts;
            if (this.#previousChar === CharCode.CarriageReturn) {
                this.#cr++;
            }
        }
    }

    acceptChunk(chunk: string) {
        if (chunk.length === 0) {
            return;
        }

        if (this.#chunks.length === 0) {
            if (startsWithUTF8BOM(chunk)) {
                chunk = chunk.slice(1);
            }
        }

        const lastChar = chunk.charCodeAt(chunk.length - 1);
        if (lastChar === CharCode.CarriageReturn || (lastChar >= 0xd800 && lastChar <= 0xdbff)) {
            // last character is \r or a high surrogate => keep it back
            this.#acceptChunk1(chunk.slice(0, chunk.length - 1), false);
            this.#hasPreviousChar = true;
            this.#previousChar = lastChar;
        } else {
            this.#acceptChunk1(chunk, false);
            this.#hasPreviousChar = false;
            this.#previousChar = lastChar;
        }
    }

    finish(normalizeEOL: boolean = true) {
        this.#finish();
        return new PieceTreeTextBufferFactory(this.#chunks, this.#cr, this.#lf, this.#crlf, normalizeEOL);
    }
}
