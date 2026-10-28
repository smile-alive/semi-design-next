/** reference from https://github.com/microsoft/vscode */

import { CharacterClassifier } from './characterClassifier';
import { CharCode } from './charCode';
import { LRUCache } from './map';

export const enum WordCharacterClass {
    Regular = 0,
    Whitespace = 1,
    WordSeparator = 2,
}

export class WordCharacterClassifier extends CharacterClassifier<WordCharacterClass> {
    readonly #segmenter: Intl.Segmenter | null = null;
    #cachedLine: string | null = null;
    #cachedSegments: IntlWordSegmentData[] = [];
    readonly intlSegmenterLocales: Intl.UnicodeBCP47LocaleIdentifier[];

    constructor(wordSeparators: string, intlSegmenterLocales: Intl.UnicodeBCP47LocaleIdentifier[]) {
        super(WordCharacterClass.Regular);
        this.intlSegmenterLocales = intlSegmenterLocales;
        if (this.intlSegmenterLocales.length > 0) {
            this.#segmenter = new Intl.Segmenter(this.intlSegmenterLocales, {
                granularity: 'word',
            });
        } else {
            this.#segmenter = null;
        }

        for (let i = 0, len = wordSeparators.length; i < len; i++) {
            this.set(wordSeparators.charCodeAt(i), WordCharacterClass.WordSeparator);
        }

        this.set(CharCode.Space, WordCharacterClass.Whitespace);
        this.set(CharCode.Tab, WordCharacterClass.Whitespace);
    }

    #getIntlSegmenterWordsOnLine(line: string) {
        if (!this.#segmenter) {
            return [];
        }

        if (this.#cachedLine === line) {
            return this.#cachedSegments;
        }

        this.#cachedLine = line;
        this.#cachedSegments = this.#filterWordSegments(this.#segmenter.segment(line));

        return this.#cachedSegments;
    }

    #filterWordSegments(segments: Intl.Segments) {
        const result: IntlWordSegmentData[] = [];
        for (const segment of segments) {
            if (this.#isWordLike(segment)) {
                result.push(segment);
            }
        }
        return result;
    }

    #isWordLike(segment: Intl.SegmentData): segment is IntlWordSegmentData {
        if (segment.isWordLike) {
            return true;
        }
        return false;
    }

    findPrevIntlWordBeforeOrAtOffset(line: string, offset: number): IntlWordSegmentData | null {
        let candidate: IntlWordSegmentData | null = null;
        for (const segment of this.#getIntlSegmenterWordsOnLine(line)) {
            if (segment.index > offset) {
                break;
            }
            candidate = segment;
        }
        return candidate;
    }

    findNextIntlWordAtOrAfterOffset(lineContent: string, offset: number): IntlWordSegmentData | null {
        for (const segment of this.#getIntlSegmenterWordsOnLine(lineContent)) {
            if (segment.index < offset) {
                continue;
            }
            return segment;
        }
        return null;
    }
}

export interface IntlWordSegmentData extends Intl.SegmentData {
    isWordLike: true;
}

const wordClassifierCache = new LRUCache<string, WordCharacterClassifier>(10);

type UnicodeBCP47LocaleIdentifier = string;

export function getMapForWordSeparators(wordSeparators: string, intlSegmenterLocales: UnicodeBCP47LocaleIdentifier[]) {
    const key = `${wordSeparators}/${intlSegmenterLocales.join(',')}`;
    let result = wordClassifierCache.get(key);
    if (!result) {
        result = new WordCharacterClassifier(wordSeparators, intlSegmenterLocales);
        wordClassifierCache.set(key, result);
    }
    return result;
}
