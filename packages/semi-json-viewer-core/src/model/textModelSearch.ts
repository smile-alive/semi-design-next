/** Based on https://github.com/microsoft/vscode-json-languageservice with modifications for custom requirements */
import { CharCode } from '../common/charCode';
import { FindMatch, EndOfLinePreference, SearchData } from '../common/model';
import { Range } from '../common/range';
import { createRegExp, getNextCodePoint } from '../common/strings';
import { type WordCharacterClassifier, getMapForWordSeparators, WordCharacterClass } from '../common/wordCharacterClassifier';
import type { JSONModel } from './jsonModel';

class LineFeedCounter {
    readonly #lineFeedsOffsets: number[];

    constructor(text: string) {
        const lineFeedsOffsets: number[] = [];
        let lineFeedsOffsetsLen = 0;
        for (let i = 0, textLen = text.length; i < textLen; i++) {
            if (text.charCodeAt(i) === CharCode.LineFeed) {
                lineFeedsOffsets[lineFeedsOffsetsLen++] = i;
            }
        }
        this.#lineFeedsOffsets = lineFeedsOffsets;
    }

    findLineFeedCountBeforeOffset(offset: number) {
        const lineFeedsOffsets = this.#lineFeedsOffsets;
        let min = 0;
        let max = lineFeedsOffsets.length - 1;

        if (max === -1) {
            return 0;
        }

        if (offset <= lineFeedsOffsets[0]) {
            return 0;
        }

        while (min < max) {
            const mid = min + (((max - min) / 2) >> 0);

            if (lineFeedsOffsets[mid] >= offset) {
                max = mid - 1;
            } else {
                if (lineFeedsOffsets[mid + 1] >= offset) {
                    min = mid;
                    max = mid;
                } else {
                    min = mid + 1;
                }
            }
        }
        return min + 1;
    }
}

export class TextModelSearch {
    static #doFindMatchesMultiline(model: JSONModel, searchRange: Range, searcher: Searcher, captureMatches: boolean, limitResultCount: number) {
        const pos = searchRange.getStartPosition();
        const deltaOffset = model.getOffsetAt(pos.lineNumber, pos.column);
        // Search \n-joined text so \n matches CRLF too; #getMultilineMatchRange adds back one \r per \n
        const text = model.getValueInRange(searchRange, EndOfLinePreference.LF);
        const lfCounter = model.getEOL() === '\r\n' ? new LineFeedCounter(text) : null;

        const result: FindMatch[] = [];
        let counter = 0;

        let m: RegExpExecArray | null;
        searcher.reset(0);
        while ((m = searcher.next(text))) {
            result[counter++] = createFindMatch(TextModelSearch.#getMultilineMatchRange(model, deltaOffset, text, lfCounter, m.index, m[0]), m, captureMatches);
            if (counter >= limitResultCount) {
                return result;
            }
        }

        return result;
    }

    /**
     * Multiline search always executes on the lines concatenated with \n.
     * We must therefore compensate for the count of \n in case the model is CRLF
     */
    static #getMultilineMatchRange(model: JSONModel, deltaOffset: number, _text: string, lfCounter: LineFeedCounter | null, matchIndex: number, match0: string) {
        let startOffset: number;
        let lineFeedCountBeforeMatch = 0;
        if (lfCounter) {
            lineFeedCountBeforeMatch = lfCounter.findLineFeedCountBeforeOffset(matchIndex);
            startOffset = deltaOffset + matchIndex + lineFeedCountBeforeMatch;
        } else {
            startOffset = deltaOffset + matchIndex;
        }

        let endOffset: number;
        if (lfCounter) {
            const lineFeedCountBeforeEndOfMatch = lfCounter.findLineFeedCountBeforeOffset(matchIndex + match0.length);
            const lineFeedCountInMatch = lineFeedCountBeforeEndOfMatch - lineFeedCountBeforeMatch;
            endOffset = startOffset + match0.length + lineFeedCountInMatch;
        } else {
            endOffset = startOffset + match0.length;
        }

        const startPosition = model.positionAt(startOffset);
        const endPosition = model.positionAt(endOffset);
        return new Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
    }

    static #doFindMatchesLineByLine(model: JSONModel, searchRange: Range, searchData: SearchData, captureMatches: boolean, limitResultCount: number) {
        const res: FindMatch[] = [];
        let resLen = 0;
        if (searchRange.startLineNumber === searchRange.endLineNumber) {
            const text = model.getLineContent(searchRange.startLineNumber).substring(searchRange.startColumn - 1, searchRange.endColumn - 1);
            resLen = TextModelSearch.#findMatchesInLine(searchData, text, searchRange.startLineNumber, searchRange.startColumn - 1, resLen, res, captureMatches, limitResultCount);
        }
        const text = model.getLineContent(searchRange.startLineNumber).substring(searchRange.startColumn - 1);
        resLen = TextModelSearch.#findMatchesInLine(searchData, text, searchRange.startLineNumber, searchRange.startColumn - 1, resLen, res, captureMatches, limitResultCount);

        for (let lineNumber = searchRange.startLineNumber + 1; lineNumber < searchRange.endLineNumber && resLen < limitResultCount; lineNumber++) {
            resLen = TextModelSearch.#findMatchesInLine(searchData, model.getLineContent(lineNumber), lineNumber, 0, resLen, res, captureMatches, limitResultCount);
        }

        if (resLen < limitResultCount) {
            const text = model.getLineContent(searchRange.endLineNumber).substring(0, searchRange.endColumn - 1);
            resLen = TextModelSearch.#findMatchesInLine(searchData, text, searchRange.endLineNumber, 0, resLen, res, captureMatches, limitResultCount);
        }

        return res;
    }

    static #findMatchesInLine(searchData: SearchData, text: string, lineNumber: number, deltaOffset: number, resultLen: number, result: FindMatch[], captureMatches: boolean, limitResultCount: number) {
        const wordSeparators = searchData.wordSeparators;
        if (!captureMatches && searchData.simpleSearch) {
            const searchString = searchData.simpleSearch;
            const searchStringLen = searchString.length;
            const textLength = text.length;
            let lastMatchIndex = -searchStringLen;
            while ((lastMatchIndex = text.indexOf(searchString, lastMatchIndex + searchStringLen)) !== -1) {
                if (!wordSeparators || isValidMatch(wordSeparators, text, textLength, lastMatchIndex, searchStringLen)) {
                    result[resultLen++] = new FindMatch(new Range(lineNumber, lastMatchIndex + 1 + deltaOffset, lineNumber, lastMatchIndex + 1 + searchStringLen + deltaOffset), null);
                    if (resultLen >= limitResultCount) return resultLen;
                }
            }
        }
        const searcher = new Searcher(searchData.wordSeparators, searchData.regex);
        let m: RegExpExecArray | null;
        searcher.reset(0);
        do {
            m = searcher.next(text);
            if (m) {
                result[resultLen++] = createFindMatch(new Range(lineNumber, m.index + 1 + deltaOffset, lineNumber, m.index + 1 + m[0].length + deltaOffset), m, captureMatches);
                if (resultLen >= limitResultCount) {
                    return resultLen;
                }
            }
        } while (m);
        return resultLen;
    }
    static findMatches(model: JSONModel, searchParams: SearchParams, searchRange: Range, captureMatches: boolean, limitResultCount: number) {
        const searchData = searchParams.parseSearchRequest();
        if (!searchData) return [];
        if (searchData.regex.multiline) {
            return TextModelSearch.#doFindMatchesMultiline(model, searchRange, new Searcher(searchData.wordSeparators, searchData.regex), captureMatches, limitResultCount);
        }
        return TextModelSearch.#doFindMatchesLineByLine(model, searchRange, searchData, captureMatches, limitResultCount);
    }
}

export class SearchParams {
    readonly searchString: string;
    readonly isRegex: boolean;
    readonly matchCase: boolean;
    readonly wordSeparators: string | null;

    constructor(searchString: string, isRegex: boolean, matchCase: boolean, wordSeparators: string | null) {
        this.searchString = searchString;
        this.isRegex = isRegex;
        this.matchCase = matchCase;
        this.wordSeparators = wordSeparators;
    }

    parseSearchRequest(): SearchData | null {
        if (this.searchString === '') {
            return null;
        }

        let multiline: boolean;
        if (this.isRegex) {
            multiline = isMultilineRegexSource(this.searchString);
        } else {
            multiline = this.searchString.indexOf('\n') >= 0;
        }

        let regex: RegExp | null = null;
        try {
            regex = createRegExp(this.searchString, this.isRegex, {
                matchCase: this.matchCase,
                wholeWord: false,
                multiline: multiline,
                global: true,
                unicode: true,
            });
        } catch (err) {
            return null;
        }

        if (!regex) {
            return null;
        }

        let canUseSimpleSearch = !this.isRegex && !multiline;
        if (canUseSimpleSearch && this.searchString.toLowerCase() !== this.searchString.toUpperCase()) {
            // casing might make a difference
            canUseSimpleSearch = this.matchCase;
        }

        return new SearchData(regex, this.wordSeparators ? getMapForWordSeparators(this.wordSeparators, []) : null, canUseSimpleSearch ? this.searchString : null);
    }
}

export function isMultilineRegexSource(searchString: string) {
    if (!searchString || searchString.length === 0) {
        return false;
    }

    for (let i = 0, len = searchString.length; i < len; i++) {
        const chCode = searchString.charCodeAt(i);

        if (chCode === CharCode.LineFeed) {
            return true;
        }

        if (chCode === CharCode.Backslash) {
            i++;

            if (i >= len) {
                break;
            }

            const nextChCode = searchString.charCodeAt(i);
            if (nextChCode === CharCode.n || nextChCode === CharCode.r || nextChCode === CharCode.W) {
                return true;
            }
        }
    }

    return false;
}

function leftIsWordBounday(wordSeparators: WordCharacterClassifier, text: string, _textLength: number, matchStartIndex: number, matchLength: number) {
    if (matchStartIndex === 0) {
        return true;
    }

    const charBefore = text.charCodeAt(matchStartIndex - 1);
    if (wordSeparators.get(charBefore) !== WordCharacterClass.Regular) {
        return true;
    }

    if (charBefore === CharCode.CarriageReturn || charBefore === CharCode.LineFeed) {
        return true;
    }

    if (matchLength > 0) {
        const firstCharInMatch = text.charCodeAt(matchStartIndex);
        if (wordSeparators.get(firstCharInMatch) !== WordCharacterClass.Regular) {
            return true;
        }
    }

    return false;
}

function rightIsWordBounday(wordSeparators: WordCharacterClassifier, text: string, textLength: number, matchStartIndex: number, matchLength: number) {
    if (matchStartIndex + matchLength === textLength) {
        return true;
    }

    const charAfter = text.charCodeAt(matchStartIndex + matchLength);
    if (wordSeparators.get(charAfter) !== WordCharacterClass.Regular) {
        return true;
    }

    if (charAfter === CharCode.CarriageReturn || charAfter === CharCode.LineFeed) {
        return true;
    }

    if (matchLength > 0) {
        const lastCharInMatch = text.charCodeAt(matchStartIndex + matchLength - 1);
        if (wordSeparators.get(lastCharInMatch) !== WordCharacterClass.Regular) {
            return true;
        }
    }

    return false;
}

export function isValidMatch(wordSeparators: WordCharacterClassifier, text: string, textLength: number, matchStartIndex: number, matchLength: number) {
    return leftIsWordBounday(wordSeparators, text, textLength, matchStartIndex, matchLength) && rightIsWordBounday(wordSeparators, text, textLength, matchStartIndex, matchLength);
}

export class Searcher {
    readonly #searchRegex: RegExp;
    #prevMatchStartIndex: number;
    #prevMatchLength: number;
    readonly wordSeparators: WordCharacterClassifier | null;

    constructor(wordSeparators: WordCharacterClassifier | null, searchRegex: RegExp) {
        this.wordSeparators = wordSeparators;
        this.#searchRegex = searchRegex;
        this.#prevMatchStartIndex = -1;
        this.#prevMatchLength = 0;
    }

    reset(lastIndex: number) {
        this.#searchRegex.lastIndex = lastIndex;
        this.#prevMatchStartIndex = -1;
        this.#prevMatchLength = 0;
    }

    next(text: string): RegExpExecArray | null {
        const textLength = text.length;

        let m: RegExpExecArray | null;
        do {
            if (this.#prevMatchStartIndex + this.#prevMatchLength === textLength) {
                return null;
            }

            m = this.#searchRegex.exec(text);
            if (!m) {
                return null;
            }

            const matchStartIndex = m.index;
            const matchLength = m[0].length;
            if (matchStartIndex === this.#prevMatchStartIndex && matchLength === this.#prevMatchLength) {
                if (matchLength === 0) {
                    // an empty match does not advance `regex.lastIndex`; advance by two on a surrogate pair, else one
                    if (getNextCodePoint(text, textLength, this.#searchRegex.lastIndex) > 0xffff) {
                        this.#searchRegex.lastIndex += 2;
                    } else {
                        this.#searchRegex.lastIndex += 1;
                    }
                    continue;
                }
                return null;
            }
            this.#prevMatchStartIndex = matchStartIndex;
            this.#prevMatchLength = matchLength;

            if (!this.wordSeparators || isValidMatch(this.wordSeparators, text, textLength, matchStartIndex, matchLength)) {
                return m;
            }
        } while (m);

        return null;
    }
}

export function createFindMatch(range: Range, rawMatches: RegExpExecArray, captureMatches: boolean) {
    if (!captureMatches) {
        return new FindMatch(range, null);
    }
    const matches: string[] = [];
    for (let i = 0, len = rawMatches.length; i < len; i++) {
        matches[i] = rawMatches[i];
    }
    return new FindMatch(range, matches);
}
