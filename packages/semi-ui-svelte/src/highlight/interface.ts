import type { HighlightStyle } from '@fibrae/semi-foundation/highlight/foundation';

export type { HighlightStyle } from '@fibrae/semi-foundation/highlight/foundation';

export interface ComplexSearchWord {
    text: string;
    class?: string;
    style?: HighlightStyle;
}

export type SearchWord = string | ComplexSearchWord | undefined;
export type SearchWords = SearchWord[];

export interface HighlightProps {
    autoEscape?: boolean;
    caseSensitive?: boolean;
    sourceString?: string;
    searchWords?: string | SearchWords;
    /** Camel-case or kebab-case keys; numbers are written as-is, so lengths need a unit string */
    highlightStyle?: HighlightStyle;
    highlightClassName?: string;
    /** Tag of each highlighted chunk */
    component?: string;
}
