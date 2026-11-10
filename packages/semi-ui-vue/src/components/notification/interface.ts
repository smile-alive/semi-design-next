import type { HTMLAttributes, StyleValue, VNode, VNodeChild } from 'vue';
import type { HookApi } from '@fibrae/semi-foundation/base';
import type { NoticeProps as FoundationNoticeProps } from '@fibrae/semi-foundation/components/notification/notification-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import type { ElementProps } from '../../base/index';

export type { ConfigProps as NotificationConfigProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
export type { NoticePosition, NoticeTheme, NoticeType } from '@fibrae/semi-foundation/components/notification/notification-foundation';

/** Same shape as ToastNode: a text, a VNode, or a function rendered as a functional component (it may inject) */
export type NotificationNode = string | VNode | (() => VNodeChild);

/** Undeclared options land on the notice element as attrs (F2, F6) */
export interface NoticeProps extends Omit<FoundationNoticeProps, 'title' | 'content' | 'icon' | 'className' | 'style' | 'close' | 'onClick'>, ElementProps<'div', 'id' | 'title' | 'class' | 'style' | 'innerHTML' | 'onClick'> {
    title?: NotificationNode;
    content?: NotificationNode;
    icon?: NotificationNode;
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    onClick?: (e: MouseEvent) => void;
    /** Offsets of the list the notification lands in; the foundation's NoticeProps does not declare them */
    top?: ConfigProps['top'];
    bottom?: ConfigProps['bottom'];
    left?: ConfigProps['left'];
    right?: ConfigProps['right'];
    // forwarded to the notice element
    [attribute: `data-${string}` | `aria-${string}`]: string | number | boolean | undefined;
}

/** A hook's notifications render where its Holder is, so the wrapper-level options do not apply */
export type NotificationHookOptions = Omit<NoticeProps, 'type' | 'id' | 'zIndex' | 'getPopupContainer'>;

export type NotificationHookApi = HookApi<NotificationHookOptions>;
