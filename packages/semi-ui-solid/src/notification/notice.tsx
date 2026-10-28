import { children, createUniqueId, Show, splitProps, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/notification/constants';
import NotificationFoundation, { type NoticeAdapter, type NoticeProps as FoundationNoticeProps, type NoticeState } from '@fibrae/semi-foundation/notification/notification-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { isAlertType } from '@fibrae/semi-foundation/utils/announcer';
import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import { createIconSlot } from '../_base/icon-slot';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useNoticeClose from '../_base/use-notice-close';
import useConfig from '../config-provider/use-config';
import IconButton from '../icon-button';
import useLocale from '../locale/use-locale';
import { useNotificationListContext } from './context';

const prefixCls = cssClasses.NOTICE;

/**
 * An element, or a function the notice calls where it renders. JSX created in an event handler has no owner, so only a
 * function reads the context around a hook's holder.
 */
export type NotificationNode = JSX.Element | (() => JSX.Element);

/**
 * Options of one notification, also the props of a Notice; unknown keys such as `data-*` and `dir` land on the notice
 * element (F2). The list sets `close` and `ref`.
 */
export interface NoticeProps extends Omit<FoundationNoticeProps, 'className' | 'content' | 'icon' | 'onClick' | 'style' | 'title'>, ElementProps<'div', 'children' | 'content' | 'onClose' | 'ref' | 'style' | 'title'> {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
    title?: NotificationNode;
    content?: NotificationNode;
    /** Replaces the icon of `type`; a Semi icon without a size of its own is sized large */
    icon?: NotificationNode;
    style?: JSX.CSSProperties | string;
    /** Offsets of the list the notification lands in; the foundation's NoticeProps does not declare them */
    top?: ConfigProps['top'];
    bottom?: ConfigProps['bottom'];
    left?: ConfigProps['left'];
    right?: ConfigProps['right'];
    ref?: (element: HTMLDivElement) => void;
}

/** Options of one notification opened through the static methods or a hook; the list supplies the omitted keys */
export type NotificationOptions = Omit<NoticeProps, 'close' | 'ref'>;

export type { NoticeState } from '@fibrae/semi-foundation/notification/notification-foundation';

type Foundation = NotificationFoundation<NoticeProps>;
type Adapter = NoticeAdapter<NoticeProps>;

const defaultProps = {
    duration: numbers.duration,
    id: '',
    content: '',
    title: '',
    showClose: true,
    theme: 'normal',
} satisfies Partial<NoticeProps>;

const iconMap = {
    warning: IconAlertTriangle,
    success: IconTickCircle,
    info: IconInfoCircle,
    error: IconAlertCircle,
};

export default function Notice(rawProps: NoticeProps) {
    const props = useDefaultProps('Notification', rawProps, defaultProps);

    // options from Notification.config() and the list's own options ride along and must stay off the DOM
    const [local, rest] = splitProps(props, ['bottom', 'class', 'close', 'content', 'dir', 'direction', 'duration', 'getPopupContainer', 'icon', 'id', 'left', 'onClose', 'onCloseClick', 'position', 'right', 'showClose', 'stack', 'style', 'theme', 'title', 'top', 'type', 'zIndex']);

    const config = useConfig();
    const locale = useLocale('Notification');
    const list = useNotificationListContext();

    const { foundation } = useFoundation<Foundation, Adapter, NoticeProps, NoticeState>(
        NotificationFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyWrapperToRemove: (id) => base.getProps().close?.(id),
            notifyClose: () => base.getProps().onClose?.(),
            notifyCloseClick: (id) => base.getProps().onCloseClick?.(id),
        })
    );

    const titleId = `${prefixCls}-title-${createUniqueId()}`;

    // children() calls a function node here, under this notice's owner
    const title = children(() => local.title as JSX.Element);
    const content = children(() => local.content as JSX.Element);

    const icon = createIconSlot(
        () => local.icon as JSX.Element,
        () => 'large'
    );

    const isAlert = () => isAlertType(local.type);

    const typeIcon = () => iconMap[local.type as keyof typeof iconMap];

    useNoticeClose(foundation, list, () => local.id);

    return (
        <div
            {...rest}
            dir={local.dir ?? (local.direction || config().direction)}
            class={clsx(prefixCls, local.class, `${prefixCls}-${local.type}`, { [`${prefixCls}-light`]: local.theme === 'light' })}
            style={local.style}
            aria-labelledby={hasContent(title()) ? titleId : undefined}
            // A status element inserted with its text is announced unreliably; the list's live region announces it.
            aria-live={isAlert() ? undefined : 'off'}
            role={isAlert() ? 'alert' : 'status'}
        >
            <div>
                <Show when={hasContent(icon()) || typeIcon()}>
                    <div class={clsx(`${prefixCls}-icon`, `${prefixCls}-${local.type}`)} x-semi-prop="icon">
                        <Show when={hasContent(icon())} fallback={<Dynamic component={typeIcon()} size="large" />}>
                            {icon()}
                        </Show>
                    </div>
                </Show>
            </div>
            <div class={`${prefixCls}-inner`}>
                <div class={`${prefixCls}-content-wrapper`}>
                    <Show when={hasContent(title())}>
                        <div id={titleId} class={`${prefixCls}-title`} x-semi-prop="title">
                            {title()}
                        </div>
                    </Show>
                    <Show when={hasContent(content())}>
                        <div class={`${prefixCls}-content`} x-semi-prop="content">
                            {content()}
                        </div>
                    </Show>
                </div>
                <Show when={local.showClose}>
                    <IconButton type="tertiary" class={`${prefixCls}-icon-close`} aria-label={locale().locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={(e) => foundation.clickClose(e)} />
                </Show>
            </div>
        </div>
    );
}
