import type React from 'react';
import { cloneElement, useLayoutEffect, type CSSProperties } from 'react';
import clsx from 'clsx';
import { type AutoCloseListState, isAlertType } from '@fibrae/semi-foundation/base';
import { numbers, cssClasses, getStackLayerTransform } from '@fibrae/semi-foundation/components/toast/constants';
import ToastFoundation, { type ToastAdapter, type ToastInstance, type ToastState } from '@fibrae/semi-foundation/components/toast/toast-foundation';
import { IconClose, IconAlertTriangle, IconInfoCircle, IconTickCircle, IconAlertCircle } from '@fibrae/semi-icons-react';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { isSemiIcon } from '../../utils/index';
import { useConfigContext } from '../config-provider/context';
import Button from '../icon-button/index';
import useLocale from '../locale/use-locale';

type Foundation = ToastFoundation<ToastInstance>;
type Adapter = ToastAdapter<ToastInstance>;

const prefixCls = cssClasses.PREFIX;

export interface ToastItemProps extends ToastInstance, ElementProps<'div', 'content' | 'style' | 'className' | 'id' | 'onAnimationEnd' | 'onAnimationStart' | 'children' | 'dangerouslySetInnerHTML'> {
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
    /** Set by the list, which pauses, stops and restarts the countdown through it */
    listState?: AutoCloseListState;
    ref?: React.Ref<HTMLDivElement>;
}

export type { ToastState } from '@fibrae/semi-foundation/components/toast/toast-foundation';

const defaultProps = {
    content: '',
    duration: numbers.duration,
    textMaxWidth: 450,
    showClose: true,
    stack: false,
    stackExpanded: false,
    theme: 'normal',
} satisfies Partial<ToastItemProps>;

const typeIcons: Record<string, React.ReactElement<any>> = {
    warning: <IconAlertTriangle />,
    success: <IconTickCircle />,
    info: <IconInfoCircle />,
    error: <IconAlertCircle />,
};

export default function Toast(rawProps: ToastItemProps) {
    const props = useDefaultProps('Toast', rawProps, defaultProps);
    const { ref, id, motion, top, bottom, left, right, zIndex, getPopupContainer, duration, onClose, close, content, type, theme, textMaxWidth, showClose, icon, direction: propDirection, stack, stackExpanded, positionInList, listState, className, style, onAnimationStart, onAnimationEnd, ...rest } = props;

    const { direction: contextDirection } = useConfigContext();
    const { locale } = useLocale('Toast');

    let iconNode: React.ReactNode = null;

    const [foundation] = useFoundation<Foundation, Adapter, ToastInstance, ToastState>(
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

    useLayoutEffect(() => {
        if (listState) {
            foundation.handleListChange(listState);
        }
    }, [foundation, listState]);

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
            ref={ref}
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

    // The wrapper is there without stack too: the latest open decides the list's stacking, so a toast can switch
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
