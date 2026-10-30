import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Ellipsis, TypographyBaseSize, TypographyCommonProps, TypographyCopySnippets, TypographyEllipsisSnippets } from './interface.js';

export interface TypographyBaseProps extends HTMLAttributes<HTMLElement>, TypographyCommonProps, TypographyCopySnippets, TypographyEllipsisSnippets {
    code?: boolean;
    ellipsis?: Ellipsis | boolean;
    size?: TypographyBaseSize;
    spacing?: string;
    weight?: string | number;
    icon?: Snippet;
    /** Title's tag, which also picks the heading class */
    headingTag?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
    /** Numeral's formatter of the rendered text nodes */
    format?: (value: string) => string;
}

export interface EllipsisView {
    isOverflowed: boolean;
    /** The truncated text; undefined until the first JS measurement, which shows the full children meanwhile */
    ellipsisContent?: string;
    expanded: boolean;
    /** Undefined until measured; an unmeasured ellipsis counts as truncated so the expand button is rendered and the measurement takes its width into account */
    isTruncated?: boolean;
}

export const UNMEASURED: EllipsisView = { isOverflowed: false, ellipsisContent: undefined, expanded: false, isTruncated: undefined };
