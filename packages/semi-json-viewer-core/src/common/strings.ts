/** reference from https://github.com/microsoft/vscode */

import { CharCode } from './char-code';

export function escapeRegExpCharacters(value: string) {
    return value.replace(/[\\{}*+?|^$.[\]()]/g, '\\$&');
}

export function isHighSurrogate(charCode: number) {
    return 0xd800 <= charCode && charCode <= 0xdbff;
}

export function isLowSurrogate(charCode: number) {
    return 0xdc00 <= charCode && charCode <= 0xdfff;
}

export function computeCodePoint(highSurrogate: number, lowSurrogate: number) {
    return ((highSurrogate - 0xd800) << 10) + (lowSurrogate - 0xdc00) + 0x10000;
}

export function getNextCodePoint(str: string, len: number, offset: number) {
    const charCode = str.charCodeAt(offset);
    if (isHighSurrogate(charCode) && offset + 1 < len) {
        const nextCharCode = str.charCodeAt(offset + 1);
        if (isLowSurrogate(nextCharCode)) {
            return computeCodePoint(charCode, nextCharCode);
        }
    }
    return charCode;
}

export interface RegExpOptions {
    matchCase?: boolean;
    wholeWord?: boolean;
    multiline?: boolean;
    global?: boolean;
    unicode?: boolean;
}

export function createRegExp(searchString: string, isRegex: boolean, options: RegExpOptions = {}) {
    if (!searchString) {
        throw new Error('Cannot create regex from empty string');
    }
    if (!isRegex) {
        searchString = escapeRegExpCharacters(searchString);
    }
    if (options.wholeWord) {
        if (!/\B/.test(searchString.charAt(0))) {
            searchString = '\\b' + searchString;
        }
        if (!/\B/.test(searchString.charAt(searchString.length - 1))) {
            searchString = searchString + '\\b';
        }
    }
    let modifiers = '';
    if (options.global) {
        modifiers += 'g';
    }
    if (!options.matchCase) {
        modifiers += 'i';
    }
    if (options.multiline) {
        modifiers += 'm';
    }
    if (options.unicode) {
        modifiers += 'u';
    }

    return new RegExp(searchString, modifiers);
}

export function getLeadingWhitespace(str: string, start: number = 0, end: number = str.length) {
    for (let i = start; i < end; i++) {
        const chCode = str.charCodeAt(i);
        if (chCode !== CharCode.Space && chCode !== CharCode.Tab) {
            return str.substring(start, i);
        }
    }
    return str.substring(start, end);
}

export function firstNonWhitespaceIndex(str: string) {
    for (let i = 0, len = str.length; i < len; i++) {
        const chCode = str.charCodeAt(i);
        if (chCode !== CharCode.Space && chCode !== CharCode.Tab) {
            return i;
        }
    }
    return -1;
}

export const enum StringEOL {
    Unknown = 0,
    Invalid = 3,
    LF = 1,
    CRLF = 2,
}

export function countEOL(text: string): [number, number, number, StringEOL] {
    let eolCount = 0;
    let firstLineLength = 0;
    let lastLineStart = 0;
    let eol: StringEOL = StringEOL.Unknown;
    for (let i = 0, len = text.length; i < len; i++) {
        const chr = text.charCodeAt(i);

        if (chr === CharCode.CarriageReturn) {
            if (eolCount === 0) {
                firstLineLength = i;
            }
            eolCount++;
            if (i + 1 < len && text.charCodeAt(i + 1) === CharCode.LineFeed) {
                eol |= StringEOL.CRLF;
                i++;
            } else {
                eol |= StringEOL.Invalid;
            }
            lastLineStart = i + 1;
        } else if (chr === CharCode.LineFeed) {
            eol |= StringEOL.LF;
            if (eolCount === 0) {
                firstLineLength = i;
            }
            eolCount++;
            lastLineStart = i + 1;
        }
    }
    if (eolCount === 0) {
        firstLineLength = text.length;
    }
    return [eolCount, firstLineLength, text.length - lastLineStart, eol];
}
