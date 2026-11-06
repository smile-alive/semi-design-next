import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import isPromise from '../utils/is-promise';

export interface PopconfirmAdapter<P extends PopconfirmBaseProps = PopconfirmBaseProps> extends DefaultAdapter<P, PopconfirmBaseState> {
    // only a returned promise is awaited, so any other value is accepted, such as a setter's
    notifyConfirm: (e: MouseEvent) => unknown;
    notifyCancel: (e: MouseEvent) => unknown;
    notifyVisibleChange: (visible: boolean) => void;
    focusCancelButton: () => void;
    focusOkButton: () => void;
    focusPrevFocusElement: () => void;
}

interface FooterButtonProps {
    autoFocus?: boolean;
    disabled?: boolean;
}

export interface PopconfirmBaseProps {
    cancelButtonProps?: FooterButtonProps;
    defaultVisible?: boolean;
    disabled?: boolean;
    okButtonProps?: FooterButtonProps;
    visible?: boolean;
}

export interface PopconfirmBaseState {
    visible: boolean;
    cancelLoading: boolean;
    confirmLoading: boolean;
}

export default class PopConfirmFoundation<P extends PopconfirmBaseProps = PopconfirmBaseProps> extends BaseFoundation<PopconfirmAdapter<P>, P, PopconfirmBaseState> {
    // lets a settled onConfirm/onCancel Promise tell the popup was closed (maybe reopened) while pending
    #closeCount = 0;
    static override readonly propKeys = ['disabled'];

    #isOpen() {
        return Boolean(this.isControlledComponent('visible') ? this.getProps().visible : this.getStates().visible);
    }

    #closeIfUnchanged(closeCountAtStart: number) {
        if (closeCountAtStart === this.#closeCount && this.#isOpen()) {
            this.handleVisibleChange(false);
        }
    }

    static getInitialState(props: PopconfirmBaseProps): PopconfirmBaseState {
        return { visible: Boolean(props.defaultVisible), cancelLoading: false, confirmLoading: false };
    }

    /** A disabled Popconfirm renders no popup, so an open one reports the close instead of reopening when re-enabled */
    override handlePropsChange() {
        if (this.getProp('disabled') && this.#isOpen()) {
            this.handleVisibleChange(false);
        }
    }

    handleCancel = (e: MouseEvent) => {
        // the close icon has no loading state of its own, so a pending onCancel is guarded here for every entry point
        if (this.getStates().cancelLoading) {
            return;
        }
        const closeCountAtStart = this.#closeCount;
        const maybePromise = this.adapter.notifyCancel(e);
        if (isPromise(maybePromise)) {
            this.setState({ cancelLoading: true });
            maybePromise.then(
                () => {
                    this.#closeIfUnchanged(closeCountAtStart);
                    this.setState({ cancelLoading: false });
                },
                () => {
                    this.setState({ cancelLoading: false });
                }
            );
        } else {
            this.handleVisibleChange(false);
        }
    };

    handleConfirm = (e: MouseEvent) => {
        const closeCountAtStart = this.#closeCount;
        const maybePromise = this.adapter.notifyConfirm(e);
        if (isPromise(maybePromise)) {
            this.setState({ confirmLoading: true });
            maybePromise.then(
                () => {
                    this.setState({ confirmLoading: false });
                    this.#closeIfUnchanged(closeCountAtStart);
                },
                () => {
                    this.setState({ confirmLoading: false });
                }
            );
        } else {
            this.handleVisibleChange(false);
        }
    };

    handleVisibleChange = (visible: boolean) => {
        // a controlled close is recorded so dropping control cannot revive it; a controlled open is not, the parent
        // may have declined it
        if (!this.isControlledComponent('visible') || !visible) {
            this.setState({ visible });
        }
        // a close request counts as a close for a pending Promise, though the owner may apply it later
        if (!visible) {
            this.#closeCount++;
        }
        this.adapter.notifyVisibleChange(visible);
    };

    /** Hosts call this when the popup really opens, whoever set `visible` */
    handlePopupOpen = () => {
        const { cancelButtonProps, okButtonProps } = this.adapter.getProps();
        if (cancelButtonProps?.autoFocus && !cancelButtonProps.disabled) {
            this.adapter.focusCancelButton();
        } else if (okButtonProps?.autoFocus && !okButtonProps.disabled) {
            this.adapter.focusOkButton();
        }
    };

    /** Hosts call this when the popup really closes, whoever set `visible`; the card is still mounted */
    handlePopupClose = () => {
        this.setState({ visible: false });
        this.#closeCount++;
        this.adapter.focusPrevFocusElement();
    };
}
