import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/** The default item shape: any record, read by `itemKey` */
export type OverflowListItem = Record<string, any>;

export type OverflowListKey = string | number;

export interface OverflowListItemSnippetProps<T> {
    item: T;
    /** The item's position in `items` */
    index: number;
}

export interface OverflowListOverflowSnippetProps<T> {
    /** Collapse mode: the items that do not fit; scroll mode: the items scrolled out on that side */
    items: T[];
    position: 'start' | 'end';
}

/**
 * `T` stays unconstrained here so the global defaults can be typed for any item; the component itself takes records.
 */
export interface OverflowListProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
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
    wrapperProps?: HTMLAttributes<HTMLDivElement>;
    wrapperStyle?: string;
    /** Scroll mode wraps each item in a `display: contents` element and observes the first element the snippet renders */
    item?: Snippet<[OverflowListItemSnippetProps<T>]>;
    overflow?: Snippet<[OverflowListOverflowSnippetProps<T>]>;
    onOverflow?: (overflowItems: T[]) => void;
    onIntersect?: (res: Record<string, IntersectionObserverEntry>) => void;
    onVisibleStateChange?: (visibleState: Map<string, boolean>) => void;
}
