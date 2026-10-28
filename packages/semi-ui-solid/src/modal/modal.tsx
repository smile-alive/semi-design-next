import { type JSX, type Ref, Show, children, createEffect, createMemo, createRenderEffect, createSignal, on, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
import { isModal } from '@fibrae/semi-foundation/modal/modal-content-foundation';
import ModalFoundation, { type ModalAdapter, type ModalProps as FoundationModalProps, type ModalState } from '@fibrae/semi-foundation/modal/modal-foundation';
import { coversPage } from '@fibrae/semi-foundation/utils/dom';
import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
import '@fibrae/semi-foundation/modal/modal.scss';
import useCSSAnimation from '../_base/css-animation';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import PopupPortal from '../_base/popup-portal';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useMounted from '../_base/use-mounted';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';
import FooterButton, { type ModalButtonProps } from './footer-button';
import ModalContent from './modal-content';

export type { ModalState };
export type { ModalButtonProps };

type Style = JSX.CSSProperties | string;

export interface ModalProps extends Omit<FoundationModalProps, 'className' | 'style' | 'bodyStyle' | 'maskStyle'>, ElementProps<'div', keyof FoundationModalProps | 'role' | 'style'> {
    /** On the outer element inside the portal; the role="dialog" element takes every aria-* (F12) */
    class?: string;
    ref?: Ref<HTMLDivElement>;
    bodyStyle?: Style;
    cancelButtonProps?: ModalButtonProps;
    children?: JSX.Element;
    closeIcon?: JSX.Element;
    content?: JSX.Element;
    footer?: JSX.Element;
    header?: JSX.Element;
    icon?: JSX.Element;
    maskStyle?: Style;
    /** Wraps the role="dialog" element, which must stay in the result */
    modalRender?: (node: JSX.Element) => JSX.Element;
    okButtonProps?: ModalButtonProps;
    /**
     * Escape closes through a document listener, so that path passes the native KeyboardEvent. A returned Promise
     * keeps the button loading until it settles; any other return is ignored, such as a setter's.
     */
    onCancel?: (e: MouseEvent | KeyboardEvent) => unknown;
    /** A returned Promise keeps the button loading until it settles; any other return is ignored */
    onOk?: (e: MouseEvent) => unknown;
    /** Role of the dialog element, `dialog` by default; the confirm dialogs use `alertdialog` */
    role?: 'dialog' | 'alertdialog';
    /** On the `.semi-modal` box */
    style?: Style;
    title?: JSX.Element;
}

// the foundation reads none of the style props, and a string style is wider than its Record type
type FoundationProps = Omit<ModalProps, 'style' | 'bodyStyle' | 'maskStyle'>;
type Foundation = ModalFoundation<FoundationProps, ModalState, MouseEvent | KeyboardEvent, MouseEvent>;
type Adapter = ModalAdapter<FoundationProps, ModalState, MouseEvent | KeyboardEvent, MouseEvent>;

const prefix = cssClasses.DIALOG;

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
} satisfies Partial<ModalProps>;

export default function Modal(rawProps: ModalProps) {
    const props = useDefaultProps('Modal', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'afterClose',
        'bodyStyle',
        'cancelButtonProps',
        'cancelLoading',
        'cancelText',
        'centered',
        'children',
        'class',
        'closable',
        'closeIcon',
        'closeOnEsc',
        'confirmLoading',
        'content',
        'direction',
        'footer',
        'footerFill',
        'fullScreen',
        'getPopupContainer',
        'hasCancel',
        'header',
        'height',
        'icon',
        'keepDOM',
        'lazyRender',
        'mask',
        'maskClosable',
        'maskFixed',
        'maskStyle',
        'modalContentClass',
        'modalRender',
        'motion',
        'okButtonProps',
        'okText',
        'okType',
        'onCancel',
        'onOk',
        'preventScroll',
        'ref',
        'size',
        'style',
        'title',
        'visible',
        'width',
        'zIndex',
    ]);

    const locale = useLocale('Modal');
    const config = useConfig();

    // the initial value only: the effects below and the end of the animations keep it in step
    const [displayNone, setDisplayNone] = createSignal(!props.visible);
    const scroll = new ReleaseHolder();

    // shown or leaving: a close in this period still reports afterClose
    let closePending = false;

    // getPopupContainer may query a node that exists only once the parent is inserted
    const mounted = useMounted();

    const visible = createMemo(() => Boolean(local.visible));

    // showing reaches the DOM at once; hiding waits for the leave animation (reported at once without motion)
    const hidden = createMemo(() => (visible() ? false : displayNone()));
    const everShown = createMemo((shown: boolean) => shown || visible(), false);

    // Once per change: every reader would otherwise call the consumer's function again. Not called before mount (nor on
    // the server): the container it queries may not be inserted yet, and the popup is not rendered until then
    const inBody = createMemo(() => !mounted() || coversPage(local.getPopupContainer ?? config().getPopupContainer));

    const modal = () => isModal({ mask: local.mask, maskFixed: local.maskFixed, inBody: inBody() });

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, ModalState>(
        ModalFoundation,
        props,
        () => ({}),
        (base) => ({
            disabledBodyScroll: () => (modal() ? scroll.hold(lockBodyScroll) : scroll.release()),
            enabledBodyScroll: () => scroll.release(),
            notifyCancel: (e) => base.getProps().onCancel?.(e),
            notifyOk: (e) => base.getProps().onOk?.(e),
            notifyClose: () => base.getProps().afterClose?.(),
            toggleDisplayNone: (hidden) => setDisplayNone(hidden),
        })
    );

    const shouldRender = () => visible() || (local.keepDOM && (!local.lazyRender || everShown())) || (local.motion && !hidden());

    const updateState = () => foundation.toggleDisplayNone(!local.visible);

    // the mask and the content animate separately and either duration may be customized, so both report
    const content = useCSSAnimation({
        startClassName: () => (visible() ? `${prefix}-content-animate-show` : `${prefix}-content-animate-hide`),
        motion: () => local.motion,
        onAnimationEnd: updateState,
    });

    const maskAnimation = useCSSAnimation({
        startClassName: () => (visible() ? `${prefix}-mask-animate-show` : `${prefix}-mask-animate-hide`),
        motion: () => local.motion,
        onAnimationEnd: updateState,
    });

    const initialFocus = (customFooter: boolean) => ModalFoundation.getInitialFocus({ customFooter, okButtonProps: local.okButtonProps, hasCancel: local.hasCancel, cancelButtonProps: local.cancelButtonProps });

    const handleCancel = (e: MouseEvent | KeyboardEvent) => foundation.handleCancel(e);

    const defaultFooter = () => (
        <div class={clsx({ [`${prefix}-footerfill`]: local.footerFill })}>
            <Show when={local.hasCancel}>
                <FooterButton
                    type="tertiary"
                    block={local.footerFill}
                    loading={local.cancelLoading ?? state().onCancelReturnPromiseStatus === 'pending'}
                    own={local.cancelButtonProps}
                    baseStyle={local.footerFill ? { 'margin-inline-start': 'unset' } : undefined}
                    onPress={handleCancel}
                    data-type="cancel"
                    x-semi-children-alias="cancelText"
                >
                    {local.cancelText || locale().locale.cancel}
                </FooterButton>
            </Show>
            <FooterButton type={local.okType} theme="solid" block={local.footerFill} loading={local.confirmLoading ?? state().onOKReturnPromiseStatus === 'pending'} own={local.okButtonProps} onPress={(e) => foundation.handleOk(e)} data-type="ok" x-semi-children-alias="okText">
                {local.okText || locale().locale.confirm}
            </FooterButton>
        </div>
    );

    // an interrupted leave must start from the shown state, or the next close would unmount at once
    createRenderEffect(
        on(visible, (isVisible) => {
            if (isVisible) {
                setDisplayNone(false);
            }
        })
    );

    // a reopen during the leave animation keeps the one lock
    createEffect(
        on(hidden, (isHidden) => {
            if (isHidden) {
                return;
            }
            closePending = true;
            foundation.beforeShow();
            onCleanup(() => foundation.afterHide());
        })
    );

    createEffect(
        on(
            hidden,
            (isHidden) => {
                if (isHidden && closePending) {
                    closePending = false;
                    foundation.afterClose();
                }
            },
            { defer: true }
        )
    );

    onCleanup(() => {
        if (closePending) {
            closePending = false;
            foundation.afterClose();
        }
    });

    return (
        <Show when={mounted() && shouldRender()}>
            {(_shown) => {
                // resolved with the popup: JSX created during hydration has no node in the server HTML to claim
                const footer = children(() => local.footer);
                return (
                    <PopupPortal getPopupContainer={local.getPopupContainer} zIndex={local.zIndex} inBody={inBody()}>
                        <ModalContent
                            {...rest}
                            ref={mergeRefs(local.ref)}
                            class={clsx(local.class, { [`${prefix}-displayNone`]: local.keepDOM && hidden() })}
                            contentClassName={clsx(content.className(), local.modalContentClass)}
                            contentRef={content.ref}
                            maskClassName={maskAnimation.className()}
                            maskRef={maskAnimation.ref}
                            bodyStyle={local.bodyStyle}
                            maskStyle={local.maskStyle}
                            style={local.style}
                            title={local.title}
                            centered={local.centered}
                            closable={local.closable}
                            closeIcon={local.closeIcon}
                            closeOnEsc={local.closeOnEsc}
                            direction={local.direction}
                            footer={footer() === undefined ? defaultFooter() : footer()}
                            header={local.header}
                            height={local.height}
                            inBody={inBody()}
                            initialFocus={initialFocus(footer() !== undefined)}
                            isFullScreen={local.fullScreen}
                            mask={local.mask}
                            maskClosable={local.maskClosable}
                            maskFixed={local.maskFixed}
                            open={!hidden()}
                            preventScroll={local.preventScroll}
                            size={local.size}
                            width={local.width}
                            icon={local.icon}
                            modalRender={local.modalRender}
                            onClose={handleCancel}
                        >
                            {local.children}
                        </ModalContent>
                    </PopupPortal>
                );
            }}
        </Show>
    );
}
