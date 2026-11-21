import type { ClassValue, StyleValue, VNode } from 'vue';
import type { ScrollListItemPart, ScrollListPart } from '@fibrae/semi-foundation/components/scroll-list/constants';
import type { Item } from '@fibrae/semi-foundation/components/scroll-list/item-foundation';

/** An entry of a column: `text` (or `value`) is shown, `transform` formats the selected one */
export type ScrollListItem = Item;

/** `header` and `footer` share their names with the slots, which take precedence */
export interface ScrollListProps {
    bodyHeight?: number | string;
    classNames?: Partial<Record<ScrollListPart, ClassValue>>;
    footer?: string;
    header?: string;
    styles?: Partial<Record<ScrollListPart, StyleValue>>;
}

export interface ScrollListSlots {
    default?: () => VNode[];
    footer?: () => VNode[];
    header?: () => VNode[];
}

export interface ScrollItemProps<T extends ScrollListItem = ScrollListItem> {
    classNames?: Partial<Record<ScrollListItemPart, ClassValue>>;
    /** Wheel mode scrolls without end; the arrow keys wrap around in either mode */
    cycled?: boolean;
    list?: T[];
    mode?: 'normal' | 'wheel';
    motion?: boolean;
    selectedIndex?: number;
    styles?: Partial<Record<ScrollListItemPart, StyleValue>>;
    /** Formats the selected item's text, which is undefined for an item without one; an item's own `transform` wins */
    transform?: (value: T['value'], text?: string) => string;
}

export type ScrollItemSelectData<T extends ScrollListItem = ScrollListItem> = T & {
    index: number;
};

export interface ScrollItemEmits<T extends ScrollListItem = ScrollListItem> {
    'update:selectedIndex': [index: number];
    select: [data: ScrollItemSelectData<T>];
}

export interface ScrollItemHandle {
    /** Scrolls to the selected item; `selectedIndex` is not used, the target is the item last selected */
    scrollToIndex: (selectedIndex?: number, duration?: number) => void;
}
