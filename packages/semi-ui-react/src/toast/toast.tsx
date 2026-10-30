import type React from 'react';
import { cloneElement, useImperativeHandle, useRef, type CSSProperties } from 'react';
import clsx from 'clsx';
import { numbers, cssClasses, getStackLayerTransform } from '@fibrae/semi-foundation/toast/constants';
import ToastFoundation, { type ToastAdapter, type ToastInstance, type ToastState } from '@fibrae/semi-foundation/toast/toast-foundation';
import { isAlertType } from '@fibrae/semi-foundation/utils/announcer';
import { IconClose, IconAlertTriangle, IconInfoCircle, IconTickCircle, IconAlertCircle } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import { isSemiIcon } from '../_utils';
import { useConfigContext } from '../config-provider/context';
import Button from '../icon-button/index';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

export interface ToastHandle {
    /** Starts the duration over */
    restartCloseTimer: () => void;
    /** Paused by the list while the pointer or focus is inside it */
    pauseCloseTimer: () => void;
    resumeCloseTimer: () => void;
    /** Called on removal so the countdown cannot call onClose during the leave */
    leave: () => void;
    /** The text a screen reader should announce for this toast */
    announcement: () => string;
}

/** What the list holds per toast; kept out of the public handle */
export interface ToastItemHandle extends ToastHandle {
    /** The toast element, which the list's animation inspects */
    element: () => HTMLDivElement | null;
}

export interface ToastReactProps extends ToastInstance, ElementProps<'div', 'content' | 'style' | 'className' | 'id' | 'onAnimationEnd' | 'onAnimationStart' | 'children' | 'dangerouslySetInnerHTML'> {
    style?: CSSProperties;
    icon?: React.ReactNode;
    content: React.ReactNode;
    stack?: boolean;
    stackExpanded?: boolean;
    onAnimationEnd?: (e: React.AnimationEvent) => void;
    onAnimationStart?: (e: React.AnimationEvent) => void;
    positionInList?: {
        index: number;
        length: number;
    };
    ref?: React.Ref<ToastItemHandle>;
}

export type { ToastState } from '@fibrae/semi-foundation/toast/toast-foundation';

const defaultProps = {
    content: '',
    duration: numbers.duration,
    textMaxWidth: 450,
    showClose: true,
    stack: false,
    stackExpanded: false,
    theme: 'normal',
} satisfies Partial<ToastReactProps>;

const typeIcons: Record<string, React.ReactElement<any>> = {
    warning: <IconAlertTriangle />,
    success: <IconTickCircle />,
    info: <IconInfoCircle />,
    error: <IconAlertCircle />,
};

export default function Toast(rawProps: ToastReactProps) {
    const props = useDefaultProps('Toast', rawProps, defaultProps);
    const { ref, id, motion, top, bottom, left, right, zIndex, getPopupContainer, duration, onClose, close, content, type, theme, textMaxWidth, showClose, icon, direction: propDirection, stack, stackExpanded, positionInList, className, style, onAnimationStart, onAnimationEnd, ...rest } = props;

    const { direction: contextDirection } = useConfigContext();
    const { locale } = useLocale('Toast');

    const toastRef = useRef<HTMLDivElement>(null);
    let iconNode: React.ReactNode = null;

    const [foundation] = useFoundation<ToastFoundation<ToastInstance>, ToastAdapter<ToastInstance>, ToastInstance, ToastState>(
        ToastFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyWrapperToRemove: (id) => base.getProp('close')?.(id),
            notifyClose: () => base.getProp('onClose')?.(),
        })
    );

    const direction = propDirection || contextDirection;

    const toastCls = clsx(prefixCls, className, {
        [`${prefixCls}-${type}`]: true,
        [`${prefixCls}-${theme}`]: theme === 'light',
    });

    useImperativeHandle(
        ref,
        () => ({
            restartCloseTimer: foundation.restartCloseTimer,
            pauseCloseTimer: foundation.pauseCloseTimer,
            resumeCloseTimer: foundation.resumeCloseTimer,
            leave: foundation.leave,
            announcement: () => toastRef.current?.textContent ?? '',
            element: () => toastRef.current,
        }),
        [foundation]
    );

    if (icon) {
        iconNode = isSemiIcon(icon)
            ? cloneElement(icon as React.ReactElement<any>, {
                  size: (icon as React.ReactElement<any>).props.size ?? 'large',
                  className: clsx(`${prefixCls}-icon`, (icon as React.ReactElement<any>).props.className),
              })
            : icon;
    } else if (type && typeIcons[type]) {
        iconNode = cloneElement(typeIcons[type], {
            size: 'large',
            className: clsx(`${prefixCls}-icon`, `${prefixCls}-icon-${type}`),
        });
    }

    const isAlert = isAlertType(type);

    const toastNode = (
        <div
            dir={direction}
            {...rest}
            ref={toastRef}
            className={toastCls}
            style={{ ...style, transform: getStackLayerTransform(positionInList) }}
            aria-label={locale[type as keyof typeof locale] ?? locale.default}
            // A status element inserted with its text is announced unreliably; the list's live region announces it.
            aria-live={isAlert ? undefined : 'off'}
            role={isAlert ? 'alert' : 'status'}
            onAnimationEnd={onAnimationEnd}
            onAnimationStart={onAnimationStart}
        >
            <div className={`${prefixCls}-content`}>
                {iconNode}
                <span className={`${prefixCls}-content-text`} style={{ maxWidth: textMaxWidth }} x-semi-prop="content">
                    {content}
                </span>
                {showClose && (
                    <div className={`${prefixCls}-close-button`}>
                        <Button type="tertiary" aria-label={locale.close} size="small" theme="borderless" icon={<IconClose x-semi-prop="icon" />} onClick={foundation.close} />
                    </div>
                )}
            </div>
        </div>
    );

    // The wrapper is there without stack too: the list decides stacking from its newest toast, so a toast can switch
    // modes while shown, and a changed element structure would remount it, losing its state and focus.
    return (
        <div
            className={
                clsx({
                    [`${prefixCls}-zero-height-wrapper`]: stack,
                    [`${prefixCls}-zero-height-wrapper-expanded`]: stack && stackExpanded,
                }) || undefined
            }
        >
            {toastNode}
        </div>
    );
}
