import type { HTMLAttributes, StyleValue, VNode, VNodeChild } from 'vue';
import type { ToastProps as FoundationToastProps } from '@fibrae/semi-foundation/toast/toast-foundation';

export type { ConfigProps, ConfigProps as ToastConfigProps, Directions, ToastState, ToastTheme, ToastType } from '@fibrae/semi-foundation/toast/toast-foundation';
export type { ToastListProps, ToastListState } from '@fibrae/semi-foundation/toast/toast-list-foundation';

/** A text, a VNode, or a function rendered as a functional component (it may inject) */
export type ToastNode = string | VNode | (() => VNodeChild);

/** Options of one toast for the static API */
export interface ToastProps extends Omit<FoundationToastProps, 'content' | 'icon' | 'className' | 'style' | 'close'> {
    id?: string;
    content: ToastNode;
    icon?: ToastNode;
    motion?: boolean;
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    // forwarded to the toast element
    [attribute: `data-${string}` | `aria-${string}`]: string | number | boolean | undefined;
}

/** Props of the single toast the list renders; list-level options are stripped before they reach it */
export interface ToastItemProps extends Omit<ToastProps, 'content' | 'stack' | 'onClose' | 'class' | 'style' | 'top' | 'bottom' | 'left' | 'right' | 'zIndex' | 'getPopupContainer'> {
    content?: ToastNode;
    stack?: boolean;
    stackExpanded?: boolean;
    positionInList?: { index: number; length: number };
}

export interface ToastItemEmits {
    close: [];
    remove: [id: string];
}

export interface ToastHandle {
    /** Starts the duration over */
    restartCloseTimer: () => void;
    pauseCloseTimer: () => void;
    resumeCloseTimer: () => void;
}

/** Positioning and layer options belong to the static wrapper; a hook's toasts render where its Holder is */
export type ToastHookOptions = Omit<ToastProps, 'type' | 'id' | 'top' | 'bottom' | 'left' | 'right' | 'zIndex' | 'getPopupContainer'>;

export interface ToastHookApi {
    success: (config: ToastHookOptions) => string;
    info: (config: ToastHookOptions) => string;
    error: (config: ToastHookOptions) => string;
    warning: (config: ToastHookOptions) => string;
    open: (config: ToastHookOptions) => string;
    close: (id: string) => void;
}
