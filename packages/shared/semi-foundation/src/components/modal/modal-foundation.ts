import { debounce } from 'es-toolkit';
import { BaseFoundation, type DefaultAdapter, ModalResources, OverlaySession, PopupLifecycle } from '../../base/index';
import { coversPage, resolvePopupContainer, isPromise } from '../../utils/index';
import { isModal } from './modal-content-foundation';

export type OKType = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type Size = 'small' | 'medium' | 'large' | 'full-width';

/** The members of a button event the foundation reads to tell presses of different buttons apart */
export type ModalButtonEvent = Pick<Event, 'currentTarget' | 'target'>;

/** What the modal reads around it: ConfigProvider's popup container, which the modal's own prop overrides */
export interface ModalContext {
    getPopupContainer?: () => HTMLElement;
}

/** CE and OE are the host's cancel and ok events, which the foundation passes on to the callbacks */
export interface ModalAdapter<P extends ModalProps = ModalProps, CE = unknown, OE = unknown> extends DefaultAdapter<P, ModalState, ModalContext> {
    // only a returned promise is awaited, so any other value is accepted, such as a setter's
    notifyCancel: (e: CE) => unknown;
    notifyOk: (e: OE) => unknown;
    notifyClose: () => void;
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

export default class ModalFoundation<P extends ModalProps = ModalProps, CE extends ModalButtonEvent = ModalButtonEvent, OE extends ModalButtonEvent = ModalButtonEvent> extends BaseFoundation<ModalAdapter<P, CE, OE>, P, ModalState> {
    #lastCancelTarget: EventTarget | null = null;
    #lastOkTarget: EventTarget | null = null;
    // between beforeShow and afterHide: the body lock is held
    readonly #session = new OverlaySession();
    readonly #lifecycle = new PopupLifecycle();
    readonly #resources = new ModalResources();

    constructor(adapter: ModalAdapter<P, CE, OE>) {
        super(adapter);
        // a modal mounted visible is shown before its host's effects run, and a close before then still owes afterClose
        if (this.getProp('visible')) {
            this.#lifecycle.show();
        }
    }

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
            this.setState({ onCancelReturnPromiseStatus: 'pending' });
            (result as Promise<any>)
                ?.then(() => {
                    this.setState({ onCancelReturnPromiseStatus: 'fulfilled' });
                })
                ?.catch((e) => {
                    this.setState({ onCancelReturnPromiseStatus: 'rejected' });
                    throw e;
                });
        }
    }

    #invokeOk(e: OE) {
        const result = this.adapter.notifyOk(e);
        if (isPromise(result)) {
            this.setState({ onOKReturnPromiseStatus: 'pending' });
            (result as Promise<any>)
                ?.then(() => {
                    this.setState({ onOKReturnPromiseStatus: 'fulfilled' });
                })
                ?.catch((e) => {
                    this.setState({ onOKReturnPromiseStatus: 'rejected' });
                    throw e;
                });
        }
    }

    static getInitialState(): ModalState {
        return { onOKReturnPromiseStatus: undefined, onCancelReturnPromiseStatus: undefined };
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

    // A hidden instance (KeepAlive, StrictMode replay) holds no body lock and init takes it again; afterClose follows
    // the shown state, not the instance, so neither destroy nor init reports a close
    override init() {
        if (this.#session.resume()) {
            this.beforeShow();
        }
    }

    override destroy() {
        this.#debouncedOk.cancel();
        this.#debouncedCancel.cancel();
        if (this.#session.suspend()) {
            this.#resources.release();
        }
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
        if (!this.#session.begin()) {
            return;
        }
        this.#lifecycle.show();
        // ModalContent holds the layer and focus; the page keeps scrolling behind a non-modal dialog
        const { mask, maskFixed, getPopupContainer } = this.getProps();
        // resolved first, so a getter returning null fails loud here as in the portal
        const container = resolvePopupContainer(getPopupContainer ?? this.getContext('getPopupContainer'));
        const inBody = coversPage(() => container);
        this.#resources.hold({ modal: isModal({ mask, maskFixed, inBody }) });
    };

    afterHide = () => {
        if (this.#session.end()) {
            this.#resources.release();
        }
    };

    /**
     * Hosts call this when the wrap is hidden (the leave animation ended) and when the modal unmounts for good:
     * afterClose is reported once per showing, a reopening during the leave included.
     */
    handleHidden = () => {
        this.#lifecycle.ended(() => this.adapter.notifyClose());
    };
}
