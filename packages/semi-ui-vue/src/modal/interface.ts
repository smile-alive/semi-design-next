import type { HTMLAttributes, StyleValue, VNode, VNodeChild } from 'vue';
import type { ConfirmType } from '@fibrae/semi-foundation/modal/confirm';
import type { OKType, Size } from '@fibrae/semi-foundation/modal/modal-foundation';
import type { ButtonProps } from '../button/interface';

export type { ModalState, OKType, Size } from '@fibrae/semi-foundation/modal/modal-foundation';

export type Directions = 'ltr' | 'rtl';

/** Props and listeners for a footer button; `autoFocus` only selects the initially focused button. */
export interface ModalButtonProps extends ButtonProps {
    autoFocus?: boolean;
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    /** Called before the built-in ok or cancel handling, which still runs. */
    onClick?: (event: MouseEvent) => void;
}

export interface ModalProps {
    bodyStyle?: StyleValue;
    cancelButtonProps?: ModalButtonProps;
    /** undefined: loading follows the Promise returned by onCancel */
    cancelLoading?: boolean;
    cancelText?: string;
    centered?: boolean;
    closable?: boolean;
    closeOnEsc?: boolean;
    /** undefined: loading follows the Promise returned by onOk */
    confirmLoading?: boolean;
    footerFill?: boolean;
    fullScreen?: boolean;
    getPopupContainer?: () => HTMLElement;
    hasCancel?: boolean;
    height?: string | number;
    keepDOM?: boolean;
    lazyRender?: boolean;
    mask?: boolean;
    maskClosable?: boolean;
    maskFixed?: boolean;
    maskStyle?: StyleValue;
    modalContentClass?: string;
    motion?: boolean;
    okButtonProps?: ModalButtonProps;
    okText?: string;
    okType?: OKType;
    preventScroll?: boolean;
    size?: Size;
    /** Plain-text title; the `#title` slot wins. Declared so `title="x"` is not a native tooltip. */
    title?: string;
    visible?: boolean;
    width?: string | number;
    zIndex?: number;
    /**
     * Cancel button, close button, mask click and Escape (a native KeyboardEvent). `update:visible` follows once it
     * returns, or once a returned Promise fulfills.
     */
    onCancel?: (event: MouseEvent | KeyboardEvent) => Promise<unknown> | void;
    /** A returned Promise keeps the ok button loading until it settles; closing is the caller's job. */
    onOk?: (event: MouseEvent) => Promise<unknown> | void;
}

export interface ModalEmits {
    'update:visible': [visible: boolean];
    afterClose: [];
}

export interface ModalSlots {
    default?: () => VNode[];
    title?: () => VNode[];
    /** Given (even empty), it replaces the default header with the title and close button. */
    header?: () => VNode[];
    /** Given (even empty), it replaces the default buttons; an empty footer renders no footer area. */
    footer?: () => VNode[];
    icon?: () => VNode[];
    closeIcon?: () => VNode[];
    /** `modal` is the role="dialog" element; place it with `<component :is="modal" />`. */
    modal?: (props: { modal: VNode }) => VNode[];
}

export interface ModalHandle {
    /** The outer element inside the portal; null while nothing is rendered */
    readonly root: HTMLDivElement | null;
}

/** A text, a VNode, or a function rendered as a functional component (it may inject); same shape as ToastNode */
export type ModalNode = string | VNode | (() => VNodeChild);

/** Options of Modal.confirm/info/success/warning/error and of the useModal methods */
export interface ModalConfirmProps extends Omit<ModalProps, 'title' | 'visible'> {
    title?: ModalNode;
    content?: ModalNode;
    icon?: ModalNode;
    closeIcon?: ModalNode;
    /** null hides the header; undefined keeps the default one */
    header?: ModalNode | null;
    /** null hides the footer; undefined keeps the default buttons */
    footer?: ModalNode | null;
    modalRender?: (modal: VNode) => VNodeChild;
    /** The static methods render outside any ConfigProvider; the useModal methods default to its direction. */
    direction?: Directions;
    visible?: boolean;
    afterClose?: () => void;
    class?: HTMLAttributes['class'];
    style?: StyleValue;
    [attr: `aria-${string}` | `data-${string}`]: string | undefined;
}

export interface ModalHookRef {
    destroy: () => void;
    update: (config: ModalConfirmProps) => void;
}

export interface ModalHookApi {
    info: (config: ModalConfirmProps) => ModalHookRef;
    success: (config: ModalConfirmProps) => ModalHookRef;
    error: (config: ModalConfirmProps) => ModalHookRef;
    warning: (config: ModalConfirmProps) => ModalHookRef;
    confirm: (config: ModalConfirmProps) => ModalHookRef;
}

export type { ConfirmType } from '@fibrae/semi-foundation/modal/confirm';

/** A confirm's options with its type; the options ConfirmModal does not declare reach Modal as attrs. */
export type ConfirmProps = ModalConfirmProps & { type: ConfirmType };

/** The props ConfirmModal declares itself */
export interface ConfirmModalProps {
    type: ConfirmType;
    title?: ModalNode;
    content?: ModalNode;
    icon?: ModalNode;
    closeIcon?: ModalNode;
    header?: ModalNode | null;
    footer?: ModalNode | null;
    modalRender?: (modal: VNode) => VNodeChild;
    direction?: Directions;
    /** Wins over the internal state, so destroy() can close the dialog */
    visible?: boolean;
    onOk?: ModalProps['onOk'];
    onCancel?: ModalProps['onCancel'];
}

/** Internal props of ModalContent; Modal passes every one of them */
export interface ModalContentProps {
    visible: boolean;
    motion: boolean;
    inBody: boolean;
    onClose: (event: MouseEvent | KeyboardEvent) => void;
    onAfterLeave: () => void;
    /** The footer button that takes focus on open when the content has no autofocus element */
    initialFocus?: 'ok' | 'cancel';
    title?: string;
    bodyStyle?: StyleValue;
    maskStyle?: StyleValue;
    centered: boolean;
    closable: boolean;
    closeOnEsc: boolean;
    mask: boolean;
    maskClosable: boolean;
    maskFixed: boolean;
    preventScroll?: boolean;
    size: Size;
    width?: string | number;
    height?: string | number;
    isFullScreen: boolean;
    contentClass?: HTMLAttributes['class'];
}

/** Internal props of the role="dialog" element */
export interface ModalDialogProps {
    idPrefix: string;
    title?: string;
    closable: boolean;
    bodyStyle?: StyleValue;
}
