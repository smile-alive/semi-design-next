import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { HookApi } from '@fibrae/semi-foundation/base';
import type { NoticeProps as FoundationNoticeProps, NoticePosition } from '@fibrae/semi-foundation/components/notification/notification-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';

export type { ConfigProps as NotificationConfigProps, NotificationListProps, NotificationListState } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
export type { NoticePosition, NoticeTheme, NoticeType } from '@fibrae/semi-foundation/components/notification/notification-foundation';

/** A text, or a snippet rendered where the notification list is: a static notification reads no caller context, a hook's reads the calling component's */
export type NotificationNode = string | Snippet;

/** Options of one notification; unknown keys such as `data-*` and `dir` land on the notice element (F2) */
export interface NoticeProps extends Omit<FoundationNoticeProps, 'title' | 'content' | 'icon' | 'className' | 'style' | 'close' | 'onClick'>, Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'content' | 'id' | 'onclick'> {
    title?: NotificationNode;
    content?: NotificationNode;
    icon?: NotificationNode;
    onClick?: (event: MouseEvent) => void;
    /** Offsets of the list the notification lands in; the foundation's NoticeProps does not declare them */
    top?: ConfigProps['top'];
    bottom?: ConfigProps['bottom'];
    left?: ConfigProps['left'];
    right?: ConfigProps['right'];
}

export interface NoticeItemProps extends Omit<NoticeProps, 'top' | 'bottom' | 'left' | 'right' | 'zIndex' | 'getPopupContainer' | 'stack' | 'position'> {
    placement: NoticePosition;
    stack?: boolean;
    stackExpanded?: boolean;
    /** Shown notices in front of this one, which sets how far it sinks behind them in a collapsed stack */
    depth?: number;
    layer?: number;
    /** The store removed the notice: it plays its leave animation, then calls `onLeaveEnd` */
    leaving?: boolean;
    onLeaveEnd?: () => void;
    close?: (id: string) => void;
}

export type NotificationHookOptions = Omit<NoticeProps, 'type' | 'id' | 'zIndex' | 'getPopupContainer'>;

export type NotificationHookApi = HookApi<NotificationHookOptions>;
