import React, { useId, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/popconfirm/constants';
import PopconfirmFoundation, { type PopconfirmAdapter } from '@fibrae/semi-foundation/popconfirm/popconfirm-foundation';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/popconfirm/popconfirm.scss';
import { IconClose, IconAlertTriangle } from '@fibrae/semi-icons-react';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import Button, { type ButtonProps } from '../button';
import type { Type as ButtonType } from '../button/button';
import { useConfigContext } from '../config-provider/context';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverHandle, type PopoverProps } from '../popover';
import type { Position, Trigger, RenderContentProps, TooltipProps } from '../tooltip';

export interface PopconfirmProps extends PopoverProps {
    cancelText?: string;
    cancelButtonProps?: ButtonProps;
    cancelType?: ButtonType;
    defaultVisible?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    okText?: string;
    okType?: ButtonType;
    okButtonProps?: ButtonProps;
    motion?: boolean;
    title?: React.ReactNode;
    visible?: boolean;
    prefixCls?: string;
    trigger?: Trigger;
    showCloseIcon?: boolean;
    position?: Position;
    /** receives the button's native click event */
    onCancel?: (e: MouseEvent) => Promise<any> | void;
    onConfirm?: (e: MouseEvent) => Promise<any> | void;
    onVisibleChange?: (visible: boolean) => void;
    onClickOutSide?: TooltipProps['onClickOutSide'];
}

export interface PopconfirmHandle {
    /** Focuses the trigger (only with returnFocusOnClose and a non-custom trigger) */
    focusTrigger: () => void;
}

export interface PopconfirmState {
    visible: boolean;
    cancelLoading: boolean;
    confirmLoading: boolean;
}

const defaultProps = {
    // a confirmation is a dialog whatever opens it, hover and focus included, unlike a plain Popover (F12)
    role: 'dialog',
    stopPropagation: true,
    trigger: 'click',
    onVisibleChange: noop,
    disabled: false,
    icon: <IconAlertTriangle size="extra-large" />,
    okType: 'primary',
    cancelType: 'tertiary',
    prefixCls: cssClasses.PREFIX,
    showCloseIcon: true,
    onCancel: noop,
    onConfirm: noop,
    onClickOutSide: noop,
} satisfies Partial<PopconfirmProps>;

const hasNode = (node: unknown) => node != null && typeof node !== 'boolean' && node !== '';

export default function Popconfirm(rawProps: PopconfirmProps & { ref?: React.Ref<PopconfirmHandle> }): React.ReactNode {
    const props = useDefaultProps('Popconfirm', rawProps, defaultProps);
    const { title, content } = props;

    const { locale } = useLocale('Popconfirm');
    const { direction } = useConfigContext();

    const footerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<PopoverHandle>(null);

    // Tooltip mounts the card only after `visible` turns true, so the focus request waits for the footer to exist
    const pendingFocus = useRef<'cancel' | 'ok' | null>(null);

    // the title names the dialog; without one, the content is the question being confirmed
    let labelledBy = props['aria-labelledby'];

    const titleId = `${useId()}-title`;
    const contentId = `${titleId}-content`;
    const showTitle = hasNode(title);
    const showContent = hasNode(content);

    const focusButton = (type: 'cancel' | 'ok') => {
        const button = footerRef.current?.querySelector<HTMLElement>(`[data-type=${type}]`);
        if (button) {
            button.focus({ preventScroll: true });
        } else {
            pendingFocus.current = type;
        }
    };

    const [foundation, state] = useFoundation<PopconfirmFoundation<PopconfirmProps, PopconfirmState>, PopconfirmAdapter<PopconfirmProps, PopconfirmState>, PopconfirmProps, PopconfirmState>(
        PopconfirmFoundation,
        props,
        () => ({ cancelLoading: false, confirmLoading: false, visible: props.defaultVisible || false }),
        (base) => ({
            setVisible: (visible) => base.setState({ visible }),
            updateConfirmLoading: (confirmLoading) => base.setState({ confirmLoading }),
            updateCancelLoading: (cancelLoading) => base.setState({ cancelLoading }),
            notifyConfirm: (e) => base.getProps().onConfirm(e),
            notifyCancel: (e) => base.getProps().onCancel(e),
            notifyVisibleChange: (visible) => base.getProps().onVisibleChange(visible),
            focusCancelButton: () => focusButton('cancel'),
            focusOkButton: () => focusButton('ok'),
            focusPrevFocusElement: () => {
                pendingFocus.current = null;
                // focus that already left the card (Tab away from a focus trigger) stays where it went
                if (FocusTrapHandle.shouldRestoreFocus(footerRef.current?.closest('[popover]'), false)) {
                    popoverRef.current?.focusTrigger();
                }
            },
        })
    );

    const open = props.visible !== undefined ? props.visible : state.visible;

    // Tooltip reports only Popconfirm's own requests, so focus follows the `visible` it is given, whoever set it
    useLayoutEffect(() => {
        if (open) {
            foundation.handlePopupOpen();
        }
    }, [open, foundation]);

    useDidUpdate(open, (visible) => {
        if (!visible) {
            foundation.handlePopupClose();
        }
    });

    // a disabled Popconfirm renders no popup, so an open one reports the close instead of reopening when re-enabled
    useDidUpdate(props.disabled, (disabled) => {
        if (disabled && open) {
            foundation.handleVisibleChange(false);
        }
    });

    useImperativeHandle(props.ref, () => ({ focusTrigger: () => popoverRef.current?.focusTrigger() }), []);

    if (!labelledBy && !props['aria-label']) {
        labelledBy = showTitle ? titleId : showContent ? contentId : undefined;
    }

    const defaultPosition = direction === 'rtl' ? 'bottomRight' : 'bottomLeft';

    const { className, prefixCls, disabled, children, style, position = defaultPosition, ...attrs } = props;

    // Tooltip owns the dialog element and has no describedby prop; without a title the content already names it
    const describeDialog = (card: HTMLElement | null) => {
        const dialog = card?.closest('[popover]');
        if (!dialog || !showTitle || !showContent) {
            return undefined;
        }
        dialog.setAttribute('aria-describedby', contentId);
        return () => dialog.removeAttribute('aria-describedby');
    };

    const handleCancel = (e: React.MouseEvent) => foundation.handleCancel(e.nativeEvent);

    const handleConfirm = (e: React.MouseEvent) => foundation.handleConfirm(e.nativeEvent);

    const renderControls = () => {
        const { okText, cancelText, okType, cancelType, cancelButtonProps, okButtonProps } = props;
        return (
            <>
                {/* data-type locates the buttons for focus; a pending callback keeps its loading over the user's */}
                <Button
                    type={cancelType}
                    {...omit(cancelButtonProps, ['autoFocus'])}
                    data-type="cancel"
                    loading={state.cancelLoading || cancelButtonProps?.loading}
                    onClick={(e) => {
                        cancelButtonProps?.onClick?.(e);
                        handleCancel(e);
                    }}
                >
                    {cancelText || locale.cancel}
                </Button>
                <Button
                    type={okType}
                    theme="solid"
                    {...omit(okButtonProps, ['autoFocus'])}
                    data-type="ok"
                    loading={state.confirmLoading || okButtonProps?.loading}
                    onClick={(e) => {
                        okButtonProps?.onClick?.(e);
                        handleConfirm(e);
                    }}
                >
                    {okText || locale.confirm}
                </Button>
            </>
        );
    };

    const renderConfirmPopCard = ({ initialFocusRef }: RenderContentProps) => {
        const { content, className, style, cancelType, icon, prefixCls, showCloseIcon } = props;
        const popCardCls = clsx(prefixCls, className);
        const hasIcon = hasNode(icon);
        const setFooter = (footer: HTMLDivElement | null) => {
            footerRef.current = footer;
            const button = pendingFocus.current && footer?.querySelector<HTMLElement>(`[data-type=${pendingFocus.current}]`);
            if (button) {
                pendingFocus.current = null;
                // Tooltip focuses its initial target once the popup has opened; the autoFocus button wins over content's
                initialFocusRef.current = button;
            }
        };
        const bodyCls = clsx({
            [`${prefixCls}-body`]: true,
            [`${prefixCls}-body-withIcon`]: hasIcon,
        });

        return (
            // hides in-card clicks from document click listeners whatever stopPropagation says; Tooltip uses mousedown
            <div ref={describeDialog} className={popCardCls} style={style} onClick={(e) => e.nativeEvent.stopImmediatePropagation()}>
                <div className={`${prefixCls}-inner`}>
                    <div className={`${prefixCls}-header`}>
                        {hasIcon && (
                            <i className={`${prefixCls}-header-icon`} x-semi-prop="icon">
                                {icon}
                            </i>
                        )}
                        <div className={`${prefixCls}-header-body`}>
                            {showTitle && (
                                <div id={titleId} className={`${prefixCls}-header-title`} x-semi-prop="title">
                                    {title}
                                </div>
                            )}
                        </div>
                        {showCloseIcon && <Button type={cancelType} className={`${prefixCls}-btn-close`} aria-label={locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={handleCancel} />}
                    </div>
                    {showContent && (
                        <div id={contentId} className={bodyCls} x-semi-prop="content">
                            {typeof content === 'function' ? content({ initialFocusRef }) : content}
                        </div>
                    )}
                    <div ref={setFooter} className={`${prefixCls}-footer`}>
                        {renderControls()}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Popover
            {...attrs}
            // after attrs, which carries Popconfirm's ref
            ref={popoverRef}
            className={cssClasses.POPOVER}
            aria-labelledby={labelledBy}
            content={renderConfirmPopCard}
            position={position}
            // the wrapper stays mounted while disabled so toggling it never remounts the trigger; a custom trigger with
            // `visible` false is a Popover that cannot open
            trigger={disabled ? 'custom' : attrs.trigger}
            visible={disabled ? false : open}
            onVisibleChange={foundation.handleVisibleChange}
        >
            {children}
        </Popover>
    );
}
