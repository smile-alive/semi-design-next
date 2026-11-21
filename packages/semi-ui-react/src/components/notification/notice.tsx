import type React from 'react';
import { cloneElement, useId, useLayoutEffect } from 'react';
import clsx from 'clsx';
import { type AutoCloseListState, isAlertType } from '@fibrae/semi-foundation/base';
import { cssClasses, numbers, type NotificationPart } from '@fibrae/semi-foundation/components/notification/constants';
import NotificationFoundation, { type NoticeAdapter, type NoticeProps, type NoticeState } from '@fibrae/semi-foundation/components/notification/notification-foundation';
import type { ConfigProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-react';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { useUnwrappedLazy } from '../../hooks/index';
import { hasContent, isSemiIcon } from '../../utils/index';
import { useConfigContext } from '../config-provider/context';
import Button from '../icon-button';
import useLocale from '../locale/use-locale';

type Foundation = NotificationFoundation<NoticeProps>;
type Adapter = NoticeAdapter<NoticeProps>;

/**
 * Options of one notification, also the props of a Notice; undeclared options land on the notice element (F2, F6). The
 * list sets `close`, `listState`, `ref` and the animation handlers.
 */
export interface NoticeReactProps extends NoticeProps, ElementProps<'div', 'title' | 'content' | 'style' | 'className' | 'id' | 'children' | 'dangerouslySetInnerHTML'> {
    style?: React.CSSProperties;
    classNames?: Partial<Record<NotificationPart, string>>;
    styles?: Partial<Record<NotificationPart, React.CSSProperties>>;
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
    /** Pauses, stops and restarts the countdown */
    listState?: AutoCloseListState;
    ref?: React.Ref<HTMLDivElement>;
    // forwarded to the notice element (F2)
    [attribute: `data-${string}` | `aria-${string}`]: string | number | boolean | undefined;
}

/** Options of one notification opened through the static methods or a hook; the list supplies the omitted keys */
export type NotificationOptions = Omit<NoticeReactProps, 'close' | 'listState' | 'ref' | 'onAnimationEnd' | 'onAnimationStart'>;

const prefixCls = cssClasses.NOTICE;

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
    const { ref, duration, id, title, content, position, type, onClick, onClose, onCloseClick, showClose, close, zIndex, icon, getPopupContainer, theme, direction: directionProp, className, classNames, style, styles, onAnimationEnd, onAnimationStart, stack, top, left, bottom, right, listState, ...rest } = props;

    const { locale } = useLocale('Notification');
    const context = useConfigContext();
    const typeIcon = useUnwrappedLazy(icon || iconMap[type]);

    const [foundation] = useFoundation<Foundation, Adapter, NoticeProps, NoticeState>(
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
    const hasTitle = hasContent(title);
    const hasBody = hasContent(content);
    const isAlert = isAlertType(type);

    useLayoutEffect(() => {
        if (listState) {
            foundation.handleListChange(listState);
        }
    }, [foundation, listState]);

    return (
        <div
            dir={direction}
            {...rest}
            ref={ref}
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
                    <div className={clsx(`${prefixCls}-icon`, `${prefixCls}-${type}`, classNames?.icon)} style={styles?.icon} x-semi-prop="icon">
                        {isSemiIcon(typeIcon) ? cloneElement(typeIcon, { size: typeIcon.props.size || 'large' }) : typeIcon}
                    </div>
                )}
            </div>
            <div className={`${prefixCls}-inner`}>
                <div className={`${prefixCls}-content-wrapper`}>
                    {hasTitle && (
                        <div id={titleID} className={clsx(`${prefixCls}-title`, classNames?.title)} style={styles?.title} x-semi-prop="title">
                            {title}
                        </div>
                    )}
                    {hasBody && (
                        <div className={clsx(`${prefixCls}-content`, classNames?.content)} style={styles?.content} x-semi-prop="content">
                            {content}
                        </div>
                    )}
                </div>
                {showClose && <Button type="tertiary" className={clsx(`${prefixCls}-icon-close`, classNames?.close)} style={styles?.close} aria-label={locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={foundation.clickClose} />}
            </div>
        </div>
    );
}
