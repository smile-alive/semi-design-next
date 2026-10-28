import type { VNode } from 'vue';

export interface ContainerProps {
    visible?: boolean;
    /** Plain-text title; the `#title` slot takes precedence */
    title?: string;
    motion?: boolean;
    resizable?: boolean;
    minWidth?: number | string;
    maxWidth?: number | string;
    defaultSize?: { width?: number | string; height?: number | string };
    showClose?: boolean;
    /** Whether pressing Esc emits `cancel`; off by default */
    closeOnEsc?: boolean;
}

export interface ContainerEmits {
    /** Emitted before `cancel`, so `v-model:visible` closes the container */
    'update:visible': [visible: false];
    /** The close button or Esc */
    cancel: [event: MouseEvent | KeyboardEvent];
    /** After the show or hide animation ends */
    afterVisibleChange: [visible: boolean];
}

export interface ContainerSlots {
    default?: () => VNode[];
    title?: () => VNode[];
    /** Replaces the whole header; empty content falls back to the default header */
    header?: () => VNode[];
}

export interface ContainerHandle {
    /** The `.semi-sidebar-container` element; null while hidden */
    readonly root: HTMLDivElement | null;
}
