import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { DescriptionsItemPart } from '@fibrae/semi-foundation/components/descriptions/constants';

export type DescriptionsAlign = 'center' | 'justify' | 'left' | 'plain';
export type DescriptionsLayout = 'horizontal' | 'vertical';
export type DescriptionsSize = 'small' | 'medium' | 'large';

export interface DescriptionsData {
    key?: string | number;
    value?: string | number;
    hidden?: boolean;
    span?: number;
    classNames?: Partial<Record<DescriptionsItemPart, ClassValue>>;
    styles?: Partial<Record<DescriptionsItemPart, string>>;
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
