import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Item } from '@fibrae/semi-foundation/scroll-list/item-foundation';

/** An entry of a column: `text` (or `value`) is shown, `transform` formats the selected one */
export type ScrollListItem = Item;

export interface ScrollListProps extends HTMLAttributes<HTMLDivElement> {
    bodyHeight?: number | string;
    /** A string or a snippet; nothing is rendered for an empty string */
    footer?: Snippet | string;
    header?: Snippet | string;
}

export interface ScrollItemProps<T extends ScrollListItem = ScrollListItem> extends HTMLAttributes<HTMLDivElement> {
    /** Wheel mode scrolls without end; the arrow keys wrap around in either mode */
    cycled?: boolean;
    list?: T[];
    mode?: 'normal' | 'wheel';
    motion?: boolean;
    /** Bindable: a selection writes the new index back */
    selectedIndex?: number;
    /** Formats the selected item's text, which is undefined for an item without one; an item's own `transform` wins */
    transform?: (value: T['value'], text?: string) => string;
    /** Identifies the column to the Semi components that use it (TimePicker, DatePicker); not for end users */
    type?: string | number;
    onSelect?: (data: ScrollItemSelectData<T>) => void;
}

/** The selected item with the column's `type` and the item's index in `list` */
export type ScrollItemSelectData<T extends ScrollListItem = ScrollListItem> = T & {
    type?: string | number;
    index: number;
};

/** Used by TimePicker and DatePicker to re-centre a column, e.g. after the panel resizes */
export interface ScrollItemHandle {
    /** Scrolls to the selected item; `selectedIndex` is not used, the target is the item last selected */
    scrollToIndex: (selectedIndex?: number, duration?: number) => void;
}
