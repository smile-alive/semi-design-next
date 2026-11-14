import type { ClassValue } from 'svelte/elements';
import type { HighlightPart } from '@fibrae/semi-foundation/components/highlight/constants';
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
    classNames?: Partial<Record<HighlightPart, ClassValue>>;
    styles?: Partial<Record<HighlightPart, string>>;
    component?: string;
}
