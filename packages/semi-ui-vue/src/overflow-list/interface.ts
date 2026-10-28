import type { HTMLAttributes, StyleValue, VNode } from 'vue';

/** The default item shape: any record, read by `itemKey` */
export type OverflowListItem = Record<string, any>;

export type OverflowListKey = string | number;

/**
 * `T` stays unconstrained here so the global defaults can be typed for any item; the component itself takes records.
 */
export interface OverflowListProps<T> {
    collapseFrom?: 'start' | 'end';
    items?: T[];
    /** A property path of the item, or a function returning its key; defaults to `key`, then the position */
    itemKey?: OverflowListKey | ((item: T) => OverflowListKey);
    minVisibleItems?: number;
    /** Used by Tabs to put both overflow sides before or after the items; not meant for end users */
    overflowRenderDirection?: 'both' | 'start' | 'end';
    renderMode?: 'collapse' | 'scroll';
    threshold?: number;
    wrapperClassName?: string;
    /** Attributes of the scroll-mode wrapper that holds the visible items, such as a role that owns them */
    wrapperProps?: HTMLAttributes & Record<string, unknown>;
    wrapperStyle?: StyleValue;
}

export interface OverflowListEmits<T> {
    overflow: [overflowItems: T[]];
    intersect: [res: Record<string, IntersectionObserverEntry>];
    visibleStateChange: [visibleState: Map<string, boolean>];
}

export interface OverflowListItemSlotProps<T> {
    item: T;
    /** The item's position in `items` */
    index: number;
}

export interface OverflowListOverflowSlotProps<T> {
    /** Collapse mode: the items that do not fit; scroll mode: the items scrolled out on that side */
    items: T[];
    position: 'start' | 'end';
}

export interface OverflowListSlots<T> {
    item?: (props: OverflowListItemSlotProps<T>) => VNode[];
    overflow?: (props: OverflowListOverflowSlotProps<T>) => VNode[];
}
