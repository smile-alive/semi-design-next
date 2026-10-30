import { debounce } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import isPromise from '../utils/is-promise';

export type OKType = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type Size = 'small' | 'medium' | 'large' | 'full-width';

/** The members of a button event the foundation reads to tell presses of different buttons apart */
export type ModalButtonEvent = Pick<Event, 'currentTarget' | 'target'>;

/** CE and OE are the host's cancel and ok events, which the foundation passes on to the callbacks */
export interface ModalAdapter<P extends ModalProps = ModalProps, S extends ModalState = ModalState, CE = unknown, OE = unknown> extends DefaultAdapter<P, S> {
    disabledBodyScroll: () => void;
    enabledBodyScroll: () => void;
    // only a returned promise is awaited, so any other value is accepted, such as a setter's
    notifyCancel: (e: CE) => unknown;
    notifyOk: (e: OE) => unknown;
    notifyClose: () => void;
    toggleDisplayNone: (displayNone: boolean) => void;
}

export interface ModalProps {
    afterClose?: () => void;
    bodyStyle?: Record<string, any>;
    cancelButtonProps?: any;
    cancelText?: string;
    centered?: boolean;
    className?: string;
    modalContentClass?: string;
    closable?: boolean;
    confirmLoading?: boolean;
    cancelLoading?: boolean;
    content?: any;
    footer?: any;
    hasCancel?: boolean;
    header?: any;
    height?: string | number;
    mask?: boolean;
    maskClosable?: boolean;
    maskStyle?: Record<string, any>;
    maskFixed?: boolean;
    motion?: boolean;
    okButtonProps?: any;
    okText?: string;
    okType?: OKType;
    onCancel?: (e: any) => unknown;
    onOk?: (e: any) => unknown;
    style?: Record<string, any>;
    title?: any;
    visible?: boolean;
    width?: string | number;
    zIndex?: number;
    icon?: any;
    getPopupContainer?: () => HTMLElement;
    closeIcon?: any;
    closeOnEsc?: boolean;
    size?: Size;
    lazyRender?: boolean;
    keepDOM?: boolean;
    /**
     * Overrides the ConfigProvider direction; the static confirm methods render outside any ConfigProvider and pass it themselves
     */
    direction?: 'ltr' | 'rtl';
    fullScreen?: boolean;
    preventScroll?: boolean;
    footerFill?: boolean;
}
export interface ModalState {
    onOKReturnPromiseStatus?: 'pending' | 'fulfilled' | 'rejected';
    onCancelReturnPromiseStatus?: 'pending' | 'fulfilled' | 'rejected';
}

export default class ModalFoundation<P extends ModalProps = ModalProps, S extends ModalState = ModalState, CE extends ModalButtonEvent = ModalButtonEvent, OE extends ModalButtonEvent = ModalButtonEvent> extends BaseFoundation<ModalAdapter<P, S, CE, OE>, P, S> {
    #lastCancelTarget: EventTarget | null = null;
    #lastOkTarget: EventTarget | null = null;

    #debouncedOk = debounce(
        (e: OE) => {
            this.#invokeOk(e);
        },
        100,
        { edges: ['leading'] }
    );

    #debouncedCancel = debounce(
        (e: CE) => {
            this.#invokeCancel(e);
        },
        100,
        { edges: ['leading'] }
    );

    #invokeCancel(e: CE) {
        const result = this.adapter.notifyCancel(e);
        if (isPromise(result)) {
            this.adapter.setState({ onCancelReturnPromiseStatus: 'pending' });
            (result as Promise<any>)
                ?.then(() => {
                    this.adapter.setState({ onCancelReturnPromiseStatus: 'fulfilled' });
                })
                ?.catch((e) => {
                    this.adapter.setState({ onCancelReturnPromiseStatus: 'rejected' });
                    throw e;
                });
        }
    }

    #invokeOk(e: OE) {
        const result = this.adapter.notifyOk(e);
        if (isPromise(result)) {
            this.adapter.setState({ onOKReturnPromiseStatus: 'pending' });
            (result as Promise<any>)
                ?.then(() => {
                    this.adapter.setState({ onOKReturnPromiseStatus: 'fulfilled' });
                })
                ?.catch((e) => {
                    this.adapter.setState({ onOKReturnPromiseStatus: 'rejected' });
                    throw e;
                });
        }
    }

    /** The default footer button (its `data-type`) focused on opening; none when the caller supplies the footer */
    static getInitialFocus({ customFooter, okButtonProps, hasCancel, cancelButtonProps }: { customFooter: boolean; okButtonProps?: { autoFocus?: boolean }; hasCancel?: boolean; cancelButtonProps?: { autoFocus?: boolean } }): 'ok' | 'cancel' | undefined {
        if (customFooter) {
            return undefined;
        }
        if (okButtonProps?.autoFocus) {
            return 'ok';
        }
        return hasCancel && cancelButtonProps?.autoFocus !== false ? 'cancel' : undefined;
    }

    // body lock and afterClose follow the shown state, not the instance: StrictMode destroys and re-inits a shown
    // modal, which must neither unlock the body nor report a close
    override destroy() {
        this.#debouncedOk.cancel();
        this.#debouncedCancel.cancel();
    }

    handleCancel = (e: CE) => {
        // the dialog stays mounted for its leave animation, and its mask and close button still take clicks
        if (!this.getProp('visible')) {
            return;
        }
        const target = e?.currentTarget ?? e?.target ?? null;
        if (target !== this.#lastCancelTarget) {
            this.#debouncedCancel.cancel();
        }
        this.#lastCancelTarget = target;
        this.#debouncedCancel(e);
    };

    handleOk = (e: OE) => {
        const target = e?.currentTarget ?? e?.target ?? null;
        if (target !== this.#lastOkTarget) {
            this.#debouncedOk.cancel();
        }
        this.#lastOkTarget = target;
        this.#debouncedOk(e);
    };

    beforeShow = () => {
        this.adapter.disabledBodyScroll();
    };

    afterHide = () => {
        this.adapter.enabledBodyScroll();
    };

    afterClose = () => {
        this.adapter.notifyClose();
    };

    toggleDisplayNone = (displayNone: boolean) => {
        this.adapter.toggleDisplayNone(displayNone);
    };
}
