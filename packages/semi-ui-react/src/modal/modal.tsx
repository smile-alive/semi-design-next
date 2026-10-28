import type React from 'react';
import { type CSSProperties, type ReactNode, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
import { isModal } from '@fibrae/semi-foundation/modal/modal-content-foundation';
import ModalFoundation, { type ModalAdapter, type ModalProps, type ModalState } from '@fibrae/semi-foundation/modal/modal-foundation';
import { coversPage } from '@fibrae/semi-foundation/utils/dom';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
import '@fibrae/semi-foundation/modal/modal.scss';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useIsServerRender from '../_base/use-is-server-render';
import useRealUnmount from '../_base/use-real-unmount';
import CSSAnimation from '../_css-animation';
import Portal from '../_portal';
import Button from '../button';
import type { ButtonProps } from '../button/button';
import { useConfigContext } from '../config-provider/context';
import useLocale from '../locale/use-locale';
import ModalContent from './modal-content';

export type { ModalState } from '@fibrae/semi-foundation/modal/modal-foundation';
export interface ModalReactProps extends ModalProps {
    cancelButtonProps?: ButtonProps;
    children?: React.ReactNode;
    okButtonProps?: ButtonProps;
    bodyStyle?: CSSProperties;
    maskStyle?: CSSProperties;
    style?: CSSProperties;
    icon?: ReactNode;
    closeIcon?: ReactNode;
    title?: ReactNode;
    content?: ReactNode;
    footer?: ReactNode;
    header?: ReactNode;
    /** Escape closes through a document listener, so that path passes the native KeyboardEvent */
    onCancel?: (e: React.MouseEvent | KeyboardEvent) => void | Promise<any>;
    onOk?: (e: React.MouseEvent) => void | Promise<any>;
    modalRender?: (node: ReactNode) => ReactNode;
    /** Role of the dialog element, `dialog` by default; the confirm dialogs use `alertdialog` */
    role?: 'dialog' | 'alertdialog';
}

const defaultProps = {
    zIndex: 1000,
    motion: true,
    mask: true,
    centered: false,
    closable: true,
    visible: false,
    okType: 'primary',
    maskClosable: true,
    hasCancel: true,
    maskFixed: false,
    closeOnEsc: true,
    size: 'small',
    keepDOM: false,
    lazyRender: true,
    fullScreen: false,
} satisfies Partial<ModalReactProps>;

class ModalRuntime {
    #closePending = false;
    readonly scroll = new ReleaseHolder();

    markShown() {
        this.#closePending = true;
    }

    takePendingClose() {
        const pending = this.#closePending;
        this.#closePending = false;
        return pending;
    }

    disableBodyScroll(locksBody: boolean) {
        if (locksBody) {
            this.scroll.hold(lockBodyScroll);
        } else {
            this.scroll.release();
        }
    }
}

// autoFocus is dropped: ModalContent focuses the button on each opening, as React's autoFocus acts on mount alone
function footerButtonProps(custom: ButtonProps | undefined, handle: (e: React.MouseEvent) => void): ButtonProps {
    const { autoFocus, onClick, ...rest } = custom ?? {};
    return {
        ...rest,
        onClick: (e) => {
            onClick?.(e);
            handle(e);
        },
    };
}

/** `ref` is attached to the outer div inside the portal; null while nothing is rendered */
function Modal(rawProps: ModalReactProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactNode {
    const props = useDefaultProps('Modal', rawProps, defaultProps);

    const {
        ref,
        afterClose,
        bodyStyle,
        cancelButtonProps,
        cancelText,
        centered,
        className,
        modalContentClass,
        closable,
        confirmLoading,
        cancelLoading,
        content,
        footer,
        hasCancel,
        header,
        height,
        mask,
        maskClosable,
        maskStyle,
        maskFixed,
        motion,
        okButtonProps,
        okText,
        okType,
        onCancel,
        onOk,
        style,
        title,
        visible,
        width,
        zIndex,
        icon,
        getPopupContainer,
        closeIcon,
        closeOnEsc,
        size,
        lazyRender,
        keepDOM,
        direction,
        fullScreen,
        preventScroll,
        footerFill,
        children,
        modalRender,
        ...rest
    } = props;

    const { locale } = useLocale('Modal');
    const context = useConfigContext();

    const [runtime] = useState(() => new ModalRuntime());
    const [displayNone, setDisplayNone] = useState(!props.visible);
    const [haveRendered, setHaveRendered] = useState(false);

    const isServerRender = useIsServerRender();

    const [foundation, state] = useFoundation<ModalFoundation<ModalReactProps, ModalState, React.MouseEvent | KeyboardEvent, React.MouseEvent>, ModalAdapter<ModalReactProps, ModalState, React.MouseEvent | KeyboardEvent, React.MouseEvent>, ModalReactProps, ModalState>(
        ModalFoundation,
        props,
        () => ({}),
        (base) => ({
            disabledBodyScroll: () =>
                runtime.disableBodyScroll(
                    isModal({
                        mask: base.getProp('mask'),
                        maskFixed: base.getProp('maskFixed'),
                        inBody: coversPage(base.getProp('getPopupContainer') ?? base.getContext('getPopupContainer')),
                    })
                ),
            enabledBodyScroll: () => runtime.scroll.release(),
            notifyCancel: (e) => base.getProps().onCancel?.(e),
            notifyOk: (e) => base.getProps().onOk?.(e),
            notifyClose: () => base.getProps().afterClose?.(),
            toggleDisplayNone: (hidden) => setDisplayNone(hidden),
        }),
        context
    );

    // adjusted during render so showing reaches the DOM in the same commit as visible; hiding waits for the leave
    // animation (CSSAnimation reports it at once without motion)
    const hidden = visible ? false : displayNone;

    if (hidden !== displayNone) {
        setDisplayNone(hidden);
    }

    const shouldRender = visible || (keepDOM && (!lazyRender || haveRendered)) || (motion && !hidden);

    if (shouldRender && !haveRendered) {
        setHaveRendered(true);
    }

    const initialFocus = ModalFoundation.getInitialFocus({ customFooter: footer !== undefined, okButtonProps, hasCancel, cancelButtonProps });

    // evaluated once per render: the getter is the caller's function and ModalContent reuses the result
    // the caller's getter may read document; on the server and while hydrating the Portal renders nothing anyway
    const renderedInBody = !isServerRender && coversPage(getPopupContainer ?? context.getPopupContainer);
    const wrapperStyle: CSSProperties = renderedInBody ? { zIndex } : { zIndex, position: 'static' };

    const updateState = () => foundation.toggleDisplayNone(!visible);

    const handleCancel = (e: React.MouseEvent | KeyboardEvent) => foundation.handleCancel(e);

    const handleOk = (e: React.MouseEvent) => foundation.handleOk(e);

    const footerNode =
        footer !== undefined ? (
            footer
        ) : (
            <div className={clsx({ [`${cssClasses.DIALOG}-footerfill`]: footerFill })}>
                {hasCancel && (
                    <Button
                        type="tertiary"
                        block={footerFill}
                        loading={cancelLoading === undefined ? state.onCancelReturnPromiseStatus === 'pending' : cancelLoading}
                        {...footerButtonProps(cancelButtonProps, handleCancel)}
                        style={{
                            ...(footerFill ? { marginInlineStart: 'unset' } : {}),
                            ...cancelButtonProps?.style,
                        }}
                        data-type="cancel"
                        x-semi-children-alias="cancelText"
                    >
                        {cancelText || locale.cancel}
                    </Button>
                )}
                <Button type={okType} block={footerFill} loading={confirmLoading === undefined ? state.onOKReturnPromiseStatus === 'pending' : confirmLoading} theme="solid" {...footerButtonProps(okButtonProps, handleOk)} data-type="ok" x-semi-children-alias="okText">
                    {okText || locale.confirm}
                </Button>
            </div>
        );

    // a reopen during the leave animation keeps the one lock
    useLayoutEffect(() => {
        if (hidden) {
            return undefined;
        }
        runtime.markShown();
        foundation.beforeShow();
        return () => foundation.afterHide();
    }, [hidden, foundation, runtime]);

    useDidUpdate(hidden, (isHidden) => {
        if (isHidden && runtime.takePendingClose()) {
            foundation.afterClose();
        }
    });

    useRealUnmount(() => {
        if (runtime.takePendingClose()) {
            foundation.afterClose();
        }
    });

    return (
        <CSSAnimation startClassName={visible ? `${cssClasses.DIALOG}-content-animate-show` : `${cssClasses.DIALOG}-content-animate-hide`} animationState={visible ? 'enter' : 'leave'} motion={motion} onAnimationEnd={updateState}>
            {({ animationClassName, animationEventsNeedBind }) => (
                <CSSAnimation startClassName={visible ? `${cssClasses.DIALOG}-mask-animate-show` : `${cssClasses.DIALOG}-mask-animate-hide`} animationState={visible ? 'enter' : 'leave'} motion={motion} onAnimationEnd={updateState}>
                    {({ animationClassName: maskAnimationClassName, animationEventsNeedBind: maskAnimationEventsNeedBind }) =>
                        shouldRender ? (
                            <Portal style={wrapperStyle} getPopupContainer={getPopupContainer}>
                                <ModalContent
                                    {...rest}
                                    ref={ref}
                                    className={clsx(className, {
                                        [`${cssClasses.DIALOG}-displayNone`]: keepDOM && hidden,
                                    })}
                                    contentClassName={clsx(animationClassName, modalContentClass)}
                                    maskClassName={maskAnimationClassName}
                                    bodyStyle={bodyStyle}
                                    maskStyle={maskStyle}
                                    style={style}
                                    title={title}
                                    centered={centered}
                                    closable={closable}
                                    closeIcon={closeIcon}
                                    closeOnEsc={closeOnEsc}
                                    contentExtraProps={animationEventsNeedBind}
                                    direction={direction}
                                    footer={footerNode}
                                    header={header}
                                    height={height}
                                    inBody={renderedInBody}
                                    initialFocus={initialFocus}
                                    isFullScreen={fullScreen}
                                    mask={mask}
                                    maskClosable={maskClosable}
                                    maskExtraProps={maskAnimationEventsNeedBind}
                                    maskFixed={maskFixed}
                                    open={!hidden}
                                    preventScroll={preventScroll}
                                    size={size}
                                    width={width}
                                    icon={icon}
                                    modalRender={modalRender}
                                    onClose={handleCancel}
                                >
                                    {children}
                                </ModalContent>
                            </Portal>
                        ) : null
                    }
                </CSSAnimation>
            )}
        </CSSAnimation>
    );
}

export default Modal;
