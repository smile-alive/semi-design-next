import type { Range } from './range';
/** reference from https://github.com/microsoft/vscode */
import type { WordCharacterClassifier } from './word-character-classifier';
export const enum EndOfLinePreference {
    TextDefined = 0,
    LF = 1,
    CRLF = 2,
}

export class FindMatch {
    readonly range: Range;
    readonly matches: string[] | null;

    constructor(range: Range, matches: string[] | null) {
        this.range = range;
        this.matches = matches;
    }
}

export class SearchData {
    readonly regex: RegExp;
    readonly wordSeparators: WordCharacterClassifier | null;
    readonly simpleSearch: string | null;

    constructor(regex: RegExp, wordSeparators: WordCharacterClassifier | null, simpleSearch: string | null) {
        this.regex = regex;
        this.wordSeparators = wordSeparators;
        this.simpleSearch = simpleSearch;
    }
}
