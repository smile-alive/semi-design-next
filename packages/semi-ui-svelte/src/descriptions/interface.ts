import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type DescriptionsAlign = 'center' | 'justify' | 'left' | 'plain';
export type DescriptionsLayout = 'horizontal' | 'vertical';
export type DescriptionsSize = 'small' | 'medium' | 'large';

/** An item of `data`; nodes for its key and value come from the `itemKey` and `value` snippets */
export interface DescriptionsData {
    key?: string | number;
    value?: string | number;
    hidden?: boolean;
    span?: number;
    keyStyle?: string;
}

export interface DescriptionsSnippetArgs {
    item: DescriptionsData;
    /** Position in `data`, hidden items included */
    index: number;
}

export interface DescriptionsProps extends HTMLAttributes<HTMLDivElement> {
    align?: DescriptionsAlign;
    row?: boolean;
    size?: DescriptionsSize;
    data?: DescriptionsData[];
    layout?: DescriptionsLayout;
    column?: number;
    /** Key of each data item; defaults to `item.key` */
    itemKey?: Snippet<[DescriptionsSnippetArgs]>;
    /** Value of each data item; defaults to `item.value` */
    value?: Snippet<[DescriptionsSnippetArgs]>;
}
