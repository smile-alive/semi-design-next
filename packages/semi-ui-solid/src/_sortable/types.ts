import type { Component, JSX } from 'solid-js';
import type { UseSortableInput } from '@dnd-kit/solid/sortable';

/** Wraps the drag handle content and returns the component that renders the handle */
export type SortableHandle = (WrapperComponent: Component) => Component;

export interface OnSortEndProps {
    oldIndex: number;
    newIndex: number;
}
export type OnSortEnd = (props: OnSortEndProps) => void;

export interface RenderItemProps {
    id: string | number;
    sortableHandle: SortableHandle;
}

export interface SortableProps {
    onSortEnd: OnSortEnd;
    /** The ids of the items, in order; each must be unique */
    items: (string | number)[];
    /** Renders an item; it is called again for the copy that follows the pointer during a drag */
    renderItem: (props: RenderItemProps) => JSX.Element;
    useDragOverlay?: boolean;
    container?: Component<{ children?: JSX.Element }>;
    transition?: UseSortableInput['transition'];
    /** Builds `${prefix}-sortable-item`, `-over`, `-active` and `${prefix}-sortable-handle` */
    prefix?: string;
    dragOverlayCls?: string;
    /** Accessible name of each drag handle, read by the caller from its own locale */
    dragHandleLabel: string;
    // Lets the caller ignore the focus loss dnd-kit causes during a drag
    onDraggingChange?: (dragging: boolean) => void;
}
