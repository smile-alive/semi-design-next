import React, { useId, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/components/popconfirm/constants';
import PopconfirmFoundation, { type PopconfirmAdapter, type PopconfirmBaseState } from '@fibrae/semi-foundation/components/popconfirm/popconfirm-foundation';
import '@fibrae/semi-foundation/components/popconfirm/popconfirm.scss';
import { IconClose, IconAlertTriangle } from '@fibrae/semi-icons-react';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import useDidUpdate from '../../hooks/use-did-update';
import Button, { type ButtonProps } from '../button';
import type { Type as ButtonType } from '../button/button';
import { useConfigContext } from '../config-provider/context';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverHandle, type PopoverProps } from '../popover';
import type { Position, Trigger, RenderContentProps, TooltipProps } from '../tooltip';

type Foundation = PopconfirmFoundation<PopconfirmProps>;
type Adapter = PopconfirmAdapter<PopconfirmProps>;

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

export type PopconfirmState = PopconfirmBaseState;

const defaultProps = {
    // a confirmation is a dialog whatever opens it, hover and focus included, unlike a plain Popover (F12)
    role: 'dialog',
    stopPropagation: true,
    trigger: 'click',
    disabled: false,
    icon: <IconAlertTriangle size="extra-large" />,
    okType: 'primary',
    cancelType: 'tertiary',
    prefixCls: cssClasses.PREFIX,
    showCloseIcon: true,
} satisfies Partial<PopconfirmProps>;

const hasNode = (node: unknown) => node != null && typeof node !== 'boolean' && node !== '';

export default function Popconfirm(rawProps: PopconfirmProps & { ref?: React.Ref<PopconfirmHandle> }): React.ReactNode {
    const props = useDefaultProps('Popconfirm', rawProps, defaultProps);
    const { title, content } = props;

    const { locale } = useLocale('Popconfirm');
    const { direction } = useConfigContext();

    const footerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<PopoverHandle>(null);

    // Tooltip's initial focus target of the mounted card
    const tooltipFocusRef = useRef<RenderContentProps['initialFocusRef'] | null>(null);

    // the title names the dialog; without one, the content is the question being confirmed
    let labelledBy = props['aria-labelledby'];

    const [foundation, state] = useFoundation<Foundation, Adapter, PopconfirmProps, PopconfirmState>(
        PopconfirmFoundation,
        props,
        () => PopconfirmFoundation.getInitialState(props),
        (base) => ({
            notifyConfirm: (e) => base.getProps().onConfirm?.(e),
            notifyCancel: (e) => base.getProps().onCancel?.(e),
            notifyVisibleChange: (visible) => base.getProps().onVisibleChange?.(visible),
            getFooter: () => footerRef.current,
            setInitialFocus: (button) => {
                if (tooltipFocusRef.current) {
                    tooltipFocusRef.current.current = button;
                }
            },
            getPopup: () => popoverRef.current?.getPopup(),
            focusTrigger: () => popoverRef.current?.focusTrigger(),
        })
    );

    const titleId = `${useId()}-title`;
    const contentId = `${titleId}-content`;
    const showTitle = hasNode(title);
    const showContent = hasNode(content);
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

    useImperativeHandle(props.ref, () => ({ focusTrigger: () => popoverRef.current?.focusTrigger() }), []);

    if (!labelledBy && !props['aria-label']) {
        labelledBy = showTitle ? titleId : showContent ? contentId : undefined;
    }

    const defaultPosition = direction === 'rtl' ? 'bottomRight' : 'bottomLeft';

    const { className, prefixCls, disabled, children, style, position = defaultPosition, ...attrs } = props;

    // without a title the content already names the dialog
    const describedBy = props['aria-describedby'] || (showTitle && showContent ? contentId : undefined);

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
            tooltipFocusRef.current = footer ? initialFocusRef : null;
            if (footer) {
                foundation.handleFooterMounted();
            }
        };
        const bodyCls = clsx({
            [`${prefixCls}-body`]: true,
            [`${prefixCls}-body-withIcon`]: hasIcon,
        });

        return (
            // hides in-card clicks from document click listeners whatever stopPropagation says; Tooltip uses mousedown
            <div className={popCardCls} style={style} onClick={(e) => e.nativeEvent.stopImmediatePropagation()}>
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
            aria-describedby={describedBy}
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
