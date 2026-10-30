import type React from 'react';
import { cloneElement, useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/notification/constants';
import NotificationFoundation, { type NoticeAdapter, type NoticeProps, type NoticeState } from '@fibrae/semi-foundation/notification/notification-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { isAlertType, readNoticeText } from '@fibrae/semi-foundation/utils/announcer';
import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-react';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import { isSemiIcon } from '../_utils';
import { useConfigContext } from '../config-provider/context';
import Button from '../icon-button';
import useLocale from '../locale/use-locale';

export interface NoticeHandle {
    restartCloseTimer: () => void;
    /** The list pauses notices while the pointer or focus is on it */
    pauseCloseTimer: () => void;
    resumeCloseTimer: () => void;
    /** The text a screen reader should announce for this notice: title, then content */
    announcement: () => string;
    /** The notice element, which the list's animation inspects */
    element: () => HTMLDivElement | null;
    /** Called when the store removes the notice, so its countdown cannot call onClose during the leave */
    leave: () => void;
}

/**
 * Options of one notification, also the props of a Notice. The list sets `close`, `ref` and the animation handlers.
 */
export interface NoticeReactProps extends NoticeProps {
    style?: React.CSSProperties;
    title?: React.ReactNode;
    content?: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    onAnimationEnd?: (e: React.AnimationEvent) => void;
    onAnimationStart?: (e: React.AnimationEvent) => void;
    /** Offsets of the list the notification lands in; the foundation's NoticeProps does not declare them */
    top?: ConfigProps['top'];
    bottom?: ConfigProps['bottom'];
    left?: ConfigProps['left'];
    right?: ConfigProps['right'];
    /** Receives the close-timer handle the list uses to restart an updated notice */
    ref?: React.Ref<NoticeHandle>;
    // forwarded to the notice element (F2)
    [attribute: `data-${string}` | `aria-${string}`]: string | number | boolean | undefined;
}

/** Options of one notification opened through the static methods or a hook; the list supplies the omitted keys */
export type NotificationOptions = Omit<NoticeReactProps, 'close' | 'ref' | 'onAnimationEnd' | 'onAnimationStart'>;

const prefixCls = cssClasses.NOTICE;

const isRenderable = (node: React.ReactNode) => node != null && node !== '' && node !== false;

const defaultProps = {
    duration: numbers.duration,
    id: '',
    content: '',
    title: '',
    showClose: true,
    theme: 'normal',
} satisfies Partial<NoticeReactProps>;

const iconMap: Record<string, React.ReactElement> = {
    warning: <IconAlertTriangle size="large" />,
    success: <IconTickCircle size="large" />,
    info: <IconInfoCircle size="large" />,
    error: <IconAlertCircle size="large" />,
};

export default function Notice(rawProps: NoticeReactProps) {
    const props = useDefaultProps('Notification', rawProps, defaultProps);

    // options from Notification.config() and NoticeInstance ride along and must stay off the DOM
    const { ref, duration, id, title, content, position, type, onClick, onClose, onCloseClick, showClose, close, zIndex, icon, getPopupContainer, theme, direction: directionProp, className, style, onAnimationEnd, onAnimationStart, stack, top, left, bottom, right, ...rest } = props;

    const { locale } = useLocale('Notification');
    const context = useConfigContext();

    const noticeRef = useRef<HTMLDivElement>(null);

    const [foundation] = useFoundation<NotificationFoundation<NoticeProps>, NoticeAdapter<NoticeProps>, NoticeProps, NoticeState>(
        NotificationFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyWrapperToRemove: (id: string) => base.getProps().close?.(id),
            notifyClose: () => base.getProps().onClose?.(),
            notifyCloseClick: (id: string) => base.getProps().onCloseClick?.(id),
        })
    );

    const titleID = `${prefixCls}-title-${useId()}`;
    const direction = directionProp || context.direction;

    // 0 is a valid ReactNode and must render
    const hasTitle = isRenderable(title);
    const hasContent = isRenderable(content);
    const typeIcon = icon || iconMap[type];
    const isAlert = isAlertType(type);

    useImperativeHandle(
        props.ref,
        () => ({
            restartCloseTimer: foundation.restartCloseTimer,
            pauseCloseTimer: foundation.pauseCloseTimer,
            resumeCloseTimer: foundation.resumeCloseTimer,
            leave: foundation.leave,
            element: () => noticeRef.current,
            announcement: () => readNoticeText(noticeRef.current, prefixCls),
        }),
        [foundation]
    );

    return (
        <div
            dir={direction}
            {...rest}
            ref={noticeRef}
            className={clsx(prefixCls, className, {
                [`${prefixCls}-${type}`]: true,
                [`${prefixCls}-${theme}`]: theme === 'light',
            })}
            style={style}
            aria-labelledby={hasTitle ? titleID : undefined}
            // A status element inserted with its text is announced unreliably; the list's live region announces it.
            aria-live={isAlert ? undefined : 'off'}
            role={isAlert ? 'alert' : 'status'}
            onAnimationEnd={onAnimationEnd}
            onAnimationStart={onAnimationStart}
            onClick={onClick}
        >
            <div>
                {Boolean(typeIcon) && (
                    <div className={clsx(`${prefixCls}-icon`, `${prefixCls}-${type}`)} x-semi-prop="icon">
                        {isSemiIcon(typeIcon) ? cloneElement(typeIcon, { size: typeIcon.props.size || 'large' }) : typeIcon}
                    </div>
                )}
            </div>
            <div className={`${prefixCls}-inner`}>
                <div className={`${prefixCls}-content-wrapper`}>
                    {hasTitle && (
                        <div id={titleID} className={`${prefixCls}-title`} x-semi-prop="title">
                            {title}
                        </div>
                    )}
                    {hasContent && (
                        <div className={`${prefixCls}-content`} x-semi-prop="content">
                            {content}
                        </div>
                    )}
                </div>
                {showClose && <Button type="tertiary" className={`${prefixCls}-icon-close`} aria-label={locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={foundation.clickClose} />}
            </div>
        </div>
    );
}
