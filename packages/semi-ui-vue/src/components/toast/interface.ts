import type { HTMLAttributes, StyleValue, VNode, VNodeChild } from 'vue';
import type { HookApi } from '@fibrae/semi-foundation/base';
import type { ToastProps as FoundationToastProps } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import type { ElementProps } from '../../base/index';

export type { ConfigProps, ConfigProps as ToastConfigProps, Directions, ToastState, ToastTheme, ToastType } from '@fibrae/semi-foundation/components/toast/toast-foundation';
export type { ToastListProps, ToastListState } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';

/** A text, a VNode, or a function rendered as a functional component (it may inject) */
export type ToastNode = string | VNode | (() => VNodeChild);

/** Undeclared options land on the toast element as attrs (F2, F6) */
export interface ToastProps extends Omit<FoundationToastProps, 'content' | 'icon' | 'className' | 'style' | 'close'>, ElementProps<'div', 'id' | 'class' | 'style' | 'innerHTML'> {
    id?: string;
    content: ToastNode;
    icon?: ToastNode;
    motion?: boolean;
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    // an options object gets excess property checks, which only JSX skips for hyphenated names
    [attribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Props of the single toast the list renders; list-level options are stripped before they reach it. Not derived from
 * ToastProps: defineProps would turn its native attributes into runtime props.
 */
export interface ToastItemProps extends Omit<FoundationToastProps, 'content' | 'icon' | 'className' | 'style' | 'close' | 'stack' | 'onClose' | 'top' | 'bottom' | 'left' | 'right' | 'zIndex' | 'getPopupContainer'> {
    id?: string;
    content?: ToastNode;
    icon?: ToastNode;
    motion?: boolean;
    stack?: boolean;
    stackExpanded?: boolean;
    positionInList?: { index: number; length: number };
}

export interface ToastItemEmits {
    close: [];
    remove: [id: string];
}

/** Positioning and layer options belong to the static wrapper; a hook's toasts render where its Holder is */
export type ToastHookOptions = Omit<ToastProps, 'type' | 'id' | 'top' | 'bottom' | 'left' | 'right' | 'zIndex' | 'getPopupContainer'>;

export type ToastHookApi = HookApi<ToastHookOptions>;
