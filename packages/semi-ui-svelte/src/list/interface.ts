import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import type { ColProps, RowProps } from '../grid/interface.js';

/** Row and Col layout props shared by every item; `class` and `style` land on each item's Col */
export interface Grid extends Pick<RowProps, 'align' | 'gutter' | 'justify' | 'type'>, Pick<ColProps, 'span' | 'offset' | 'order' | 'push' | 'pull' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'class' | 'style'> {}

export interface ListItemSnippetProps<T> {
    item: T;
    index: number;
}

/**
 * `onClick` and `onRightClick` handle the click on an item, not on the list root, so the lowercase DOM handlers are
 * left out; their presence turns an item into a button.
 */
export interface ListProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'onclick' | 'oncontextmenu'> {
    bordered?: boolean;
    dataSource?: T[];
    grid?: Grid;
    layout?: 'vertical' | 'horizontal';
    loading?: boolean;
    size?: Size;
    split?: boolean;
    onClick?: (event: MouseEvent) => void;
    onRightClick?: (event: MouseEvent) => void;
    /** Renders each entry of `dataSource`, usually a ListItem */
    item?: Snippet<[ListItemSnippetProps<T>]>;
    header?: Snippet;
    footer?: Snippet;
    emptyContent?: Snippet;
    loadMore?: Snippet;
}

export interface ListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'onclick' | 'oncontextmenu'> {
    align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    /** Takes precedence over the List's `onClick` */
    onClick?: (event: MouseEvent) => void;
    /** Takes precedence over the List's `onRightClick` */
    onRightClick?: (event: MouseEvent) => void;
    header?: Snippet;
    main?: Snippet;
    extra?: Snippet;
}
