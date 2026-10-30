import type { Range } from './range';
/** reference from https://github.com/microsoft/vscode */
import type { WordCharacterClassifier } from './word-character-classifier';
export const enum EndOfLinePreference {
    /**
     * Use the end of line character identified in the text buffer.
     */
    TextDefined = 0,
    /**
     * Use line feed (\n) as the end of line character.
     */
    LF = 1,
    /**
     * Use carriage return and line feed (\r\n) as the end of line character.
     */
    CRLF = 2,
}

export class FindMatch {
    readonly range: Range;
    readonly matches: string[] | null;

    /**
     * @internal
     */
    constructor(range: Range, matches: string[] | null) {
        this.range = range;
        this.matches = matches;
    }
}
/**
 * Text snapshot that works like an iterator.
 * Will try to return chunks of roughly ~64KB size.
 * Will return null when finished.
 */
export interface ITextSnapshot {
    read(): string | null;
}

/**
 * @internal
 */
export class SearchData {
    /**
     * The regex to search for. Always defined.
     */
    readonly regex: RegExp;
    /**
     * The word separator classifier.
     */
    readonly wordSeparators: WordCharacterClassifier | null;
    /**
     * The simple string to search for (if possible).
     */
    readonly simpleSearch: string | null;

    constructor(regex: RegExp, wordSeparators: WordCharacterClassifier | null, simpleSearch: string | null) {
        this.regex = regex;
        this.wordSeparators = wordSeparators;
        this.simpleSearch = simpleSearch;
    }
}
