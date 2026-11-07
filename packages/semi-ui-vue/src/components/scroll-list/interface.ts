import type { VNode } from 'vue';
import type { Item } from '@fibrae/semi-foundation/components/scroll-list/item-foundation';

/** An entry of a column: `text` (or `value`) is shown, `transform` formats the selected one */
export type ScrollListItem = Item;

/** `header` and `footer` share their names with the slots, which take precedence */
export interface ScrollListProps {
    bodyHeight?: number | string;
    footer?: string;
    header?: string;
}

export interface ScrollListSlots {
    default?: () => VNode[];
    footer?: () => VNode[];
    header?: () => VNode[];
}

export interface ScrollItemProps<T extends ScrollListItem = ScrollListItem> {
    /** Wheel mode scrolls without end; the arrow keys wrap around in either mode */
    cycled?: boolean;
    list?: T[];
    mode?: 'normal' | 'wheel';
    motion?: boolean;
    selectedIndex?: number;
    /** Formats the selected item's text, which is undefined for an item without one; an item's own `transform` wins */
    transform?: (value: T['value'], text?: string) => string;
    /** Identifies the column to the Semi components that use it (TimePicker, DatePicker); not for end users */
    type?: string | number;
}

export type ScrollItemSelectData<T extends ScrollListItem = ScrollListItem> = T & {
    type?: string | number;
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
