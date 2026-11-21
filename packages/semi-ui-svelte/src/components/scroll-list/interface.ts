import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { ScrollListItemPart, ScrollListPart } from '@fibrae/semi-foundation/components/scroll-list/constants';
import type { Item } from '@fibrae/semi-foundation/components/scroll-list/item-foundation';

export type ScrollListItem = Item;

export interface ScrollListProps extends HTMLAttributes<HTMLDivElement> {
    bodyHeight?: number | string;
    classNames?: Partial<Record<ScrollListPart, ClassValue>>;
    /** A string or a snippet; nothing is rendered for an empty string */
    footer?: Snippet | string;
    header?: Snippet | string;
    styles?: Partial<Record<ScrollListPart, string>>;
}

export interface ScrollItemProps<T extends ScrollListItem = ScrollListItem> extends HTMLAttributes<HTMLDivElement> {
    classNames?: Partial<Record<ScrollListItemPart, ClassValue>>;
    /** Wheel mode scrolls without end; the arrow keys wrap around in either mode */
    cycled?: boolean;
    list?: T[];
    mode?: 'normal' | 'wheel';
    motion?: boolean;
    /** Bindable: a selection writes the new index back */
    selectedIndex?: number;
    styles?: Partial<Record<ScrollListItemPart, string>>;
    /** Formats the selected item's text, which is undefined for an item without one; an item's own `transform` wins */
    transform?: (value: T['value'], text?: string) => string;
    onSelect?: (data: ScrollItemSelectData<T>) => void;
}

export type ScrollItemSelectData<T extends ScrollListItem = ScrollListItem> = T & {
    index: number;
};

/** Used by TimePicker and DatePicker to re-centre a column, e.g. after the panel resizes */
export interface ScrollItemHandle {
    /** Scrolls to the selected item; `selectedIndex` is not used, the target is the item last selected */
    scrollToIndex: (selectedIndex?: number, duration?: number) => void;
}
