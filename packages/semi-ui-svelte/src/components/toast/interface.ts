import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { HookApi } from '@fibrae/semi-foundation/base';
import type { ToastPart } from '@fibrae/semi-foundation/components/toast/constants';
import type { ToastProps as FoundationToastProps } from '@fibrae/semi-foundation/components/toast/toast-foundation';

export type { ConfigProps, ConfigProps as ToastConfigProps, Directions, ToastState, ToastTheme, ToastType } from '@fibrae/semi-foundation/components/toast/toast-foundation';
export type { ToastListProps, ToastListState } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';

/** A text, or a snippet rendered where the toast list is: a static toast reads no caller context, a hook's reads the calling component's */
export type ToastNode = string | Snippet;

/** Options of one toast; unknown keys such as `data-*` and `dir` land on the toast element (F2) */
export interface ToastProps extends Omit<FoundationToastProps, 'content' | 'icon' | 'className' | 'style' | 'close'>, Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'content' | 'id'> {
    id?: string;
    /** `icon` lands on the type icon; a custom icon is a snippet with no element of its own to take it */
    classNames?: Partial<Record<ToastPart, ClassValue>>;
    content: ToastNode;
    /** Replaces the icon of `type`; a Semi icon in it sets its own size and class */
    icon?: ToastNode;
    motion?: boolean;
    styles?: Partial<Record<ToastPart, string>>;
}

export type ToastOptions = Omit<ToastProps, 'type'>;

/** Props of the single toast the list renders; list-level options are stripped before they reach it */
export interface ToastItemProps extends Omit<ToastProps, 'content' | 'stack' | 'top' | 'bottom' | 'left' | 'right' | 'zIndex' | 'getPopupContainer'> {
    content?: ToastNode;
    stack?: boolean;
    stackExpanded?: boolean;
    positionInList?: { index: number; length: number };
    /** The store removed the toast: it plays its leave animation, then calls `onLeaveEnd` */
    leaving?: boolean;
    onLeaveEnd?: () => void;
    close?: (id: string) => void;
}

/** Positioning and layer options belong to the static wrapper; a hook mounts its own wrapper */
export type ToastHookOptions = Omit<ToastOptions, 'id' | 'top' | 'bottom' | 'left' | 'right' | 'zIndex' | 'getPopupContainer'>;

export type ToastHookApi = HookApi<ToastHookOptions>;
