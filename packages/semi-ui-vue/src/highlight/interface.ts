import type { CSSProperties } from 'vue';
import type { HighlightStyle } from '@fibrae/semi-foundation/components/highlight/foundation';

export type { HighlightStyle } from '@fibrae/semi-foundation/components/highlight/foundation';

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
    /** Vue does not add `px` to numbers: write lengths as strings */
    highlightStyle?: CSSProperties;
    highlightClassName?: string;
    component?: string;
}
