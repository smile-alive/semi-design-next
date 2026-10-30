import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/**
 * How an item animates to its new position; `null` disables the animation, `undefined` keeps dnd-kit's default.
 * Mirrors @dnd-kit/dom's SortableTransition, which this package cannot name without depending on @dnd-kit/dom.
 */
export type SortableTransition = { duration?: number; easing?: string; idle?: boolean } | null;

export interface SortEndPayload {
    oldIndex: number;
    newIndex: number;
}

export interface SortableItemSnippetProps {
    id: string | number;
    index: number;
}

export interface SortableProps extends HTMLAttributes<HTMLDivElement> {
    /** The ids of the items, in order; each must be unique */
    items: (string | number)[];
    /** Accessible name of each drag handle, read by the caller from its own locale */
    dragHandleLabel: string;
    /** Builds `${prefix}-sortable-item`, `-over`, `-active` and `${prefix}-sortable-handle` */
    prefix?: string;
    transition?: SortableTransition;
    /** Class of the copy of the item that follows the pointer during a drag */
    dragOverlayClass?: string;
    onSortEnd?: (payload: SortEndPayload) => void;
    /** A drag starts (true) or ends, dropped or canceled (false) */
    onDragging?: (dragging: boolean) => void;
    /** Renders an item; it is rendered again for the copy that follows the pointer during a drag */
    item?: Snippet<[SortableItemSnippetProps]>;
}

export interface SortableHandleProps {
    children?: Snippet;
}
