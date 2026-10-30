import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ConfirmType } from '@fibrae/semi-foundation/modal/confirm';
import type { OKType, Size } from '@fibrae/semi-foundation/modal/modal-foundation';
import type { ButtonProps } from '../button/interface.js';

export type { ModalState, OKType } from '@fibrae/semi-foundation/modal/modal-foundation';
export type { ConfirmType };
// not `Size`: the package root also exports Button's
export type ModalSize = Size;

export type Directions = 'ltr' | 'rtl';

/** Props of a footer button; `autoFocus` only selects the initially focused button and never reaches the DOM. */
export interface ModalButtonProps extends ButtonProps {
    autoFocus?: boolean;
    /** Called before the built-in ok or cancel handling, which still runs. */
    onclick?: ButtonProps['onclick'];
}

export interface ModalHandle {
    /** The outer element inside the portal; null while nothing is rendered */
    getRoot: () => HTMLDivElement | null;
}

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Called once the dialog has closed and its leave animation has ended, or when it unmounts while shown. */
    afterClose?: () => void;
    bodyStyle?: string;
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
    maskStyle?: string;
    modalContentClass?: string;
    motion?: boolean;
    okButtonProps?: ModalButtonProps;
    okText?: string;
    okType?: OKType;
    preventScroll?: boolean;
    size?: Size;
    /** Bindable. Cancel, close button, mask click and Escape write `false` once `onCancel` returns (or its Promise fulfills). */
    visible?: boolean;
    width?: string | number;
    zIndex?: number;
    /**
     * Cancel button, close button, mask click and Escape (a native KeyboardEvent). A returned Promise keeps the button
     * loading until it settles and delays the close; a rejected one keeps the dialog open.
     */
    onCancel?: (event: MouseEvent | KeyboardEvent) => unknown;
    /** A returned Promise keeps the ok button loading until it settles; closing is the caller's job. */
    onOk?: (event: MouseEvent) => unknown;
    /** Plain text or a snippet. */
    title?: string | Snippet;
    /** A snippet replaces the default header (title, icon, close button); null renders no header. */
    header?: Snippet | null;
    /** A snippet replaces the default buttons; null renders no footer area. */
    footer?: Snippet | null;
    icon?: Snippet;
    closeIcon?: Snippet;
    /** `modal` is the role="dialog" element; place it with `{@render modal()}`. */
    modal?: Snippet<[{ modal: Snippet }]>;
    role?: 'dialog' | 'alertdialog';
}

/** A text, or a snippet rendered where the option belongs */
export type ModalNode = string | Snippet;

/** Options of Modal.confirm/info/success/warning/error and of the useModal methods */
export interface ModalConfirmProps extends Omit<ModalProps, 'title' | 'visible' | 'header' | 'footer' | 'icon' | 'closeIcon' | 'children'> {
    title?: ModalNode;
    content?: ModalNode;
    /** undefined keeps the type's icon; null shows none */
    icon?: ModalNode | null;
    closeIcon?: ModalNode;
    /** null hides the header; undefined keeps the default one */
    header?: ModalNode | null;
    /** null hides the footer; undefined keeps the default buttons */
    footer?: ModalNode | null;
    /** The static methods render outside any ConfigProvider; the useModal methods default to its direction. */
    direction?: Directions;
    /** Wins over the internal state, so destroy() can close the dialog */
    visible?: boolean;
}

export interface ModalHookRef {
    /** Closes the dialog through its leave animation */
    destroy: () => void;
    /** Merges into the dialog's current options */
    update: (config: ModalConfirmProps) => void;
}

export interface ModalHookApi {
    info: (config: ModalConfirmProps) => ModalHookRef;
    success: (config: ModalConfirmProps) => ModalHookRef;
    error: (config: ModalConfirmProps) => ModalHookRef;
    warning: (config: ModalConfirmProps) => ModalHookRef;
    confirm: (config: ModalConfirmProps) => ModalHookRef;
}

/** A confirm's options with its type, as ConfirmModal receives them */
export interface ConfirmProps extends ModalConfirmProps {
    type: ConfirmType;
}
