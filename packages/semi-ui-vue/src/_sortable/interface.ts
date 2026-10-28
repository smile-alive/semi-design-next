import type { VNode } from 'vue';

/**
 * How an item animates to its new position; `null` disables the animation, `undefined` keeps dnd-kit's default.
 * Mirrors @dnd-kit/dom's SortableTransition, which this package cannot name without depending on @dnd-kit/dom.
 */
export type SortableTransition = { duration?: number; easing?: string; idle?: boolean } | null;

export interface SortableProps {
    /** The ids of the items, in order; each must be unique */
    items: (string | number)[];
    /** Accessible name of each drag handle, read by the caller from its own locale */
    dragHandleLabel: string;
    /** Builds `${prefix}-sortable-item`, `-over`, `-active` and `${prefix}-sortable-handle` */
    prefix?: string;
    transition?: SortableTransition;
    /** Class of the copy of the item that follows the pointer during a drag */
    dragOverlayClass?: string;
}

export interface SortEndPayload {
    oldIndex: number;
    newIndex: number;
}

export interface SortableEmits {
    sortEnd: [payload: SortEndPayload];
    /** A drag starts (true) or ends, dropped or canceled (false) */
    dragging: [dragging: boolean];
}

export interface SortableItemSlotProps {
    id: string | number;
    index: number;
}

export interface SortableSlots {
    /** Renders an item; it is called again for the copy that follows the pointer during a drag */
    item?: (props: SortableItemSlotProps) => VNode[];
}
