import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export interface ContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Bindable; the close button and Esc write false before `onCancel` */
    visible?: boolean;
    /** Plain text or a snippet; text is what the wrappers (Annotation, MCPConfigure) default from the locale */
    title?: Snippet | string;
    motion?: boolean;
    resizable?: boolean;
    minWidth?: number | string;
    maxWidth?: number | string;
    defaultSize?: { width?: number | string; height?: number | string };
    showClose?: boolean;
    /** Whether pressing Esc calls `onCancel`; off by default */
    closeOnEsc?: boolean;
    onCancel?: (event: MouseEvent | KeyboardEvent) => void;
    afterVisibleChange?: (visible: boolean) => void;
    header?: Snippet;
    children?: Snippet;
}

export interface ContainerHandle {
    /** The `.semi-sidebar-container` element; null while hidden */
    getRoot: () => HTMLDivElement | null;
}
