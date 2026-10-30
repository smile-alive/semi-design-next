import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import isPromise from '../utils/is-promise';

export interface PopconfirmAdapter<P extends PopconfirmBaseProps = PopconfirmBaseProps, S extends PopconfirmBaseState = PopconfirmBaseState> extends DefaultAdapter<P, S> {
    setVisible: (visible: boolean) => void;
    updateConfirmLoading: (loading: boolean) => void;
    updateCancelLoading: (loading: boolean) => void;
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

/** The props the foundation reads */
export interface PopconfirmBaseProps {
    cancelButtonProps?: FooterButtonProps;
    okButtonProps?: FooterButtonProps;
    visible?: boolean;
}

/** The state the foundation reads */
export interface PopconfirmBaseState {
    visible: boolean;
    cancelLoading: boolean;
}

export default class PopConfirmFoundation<P extends PopconfirmBaseProps = PopconfirmBaseProps, S extends PopconfirmBaseState = PopconfirmBaseState> extends BaseFoundation<PopconfirmAdapter<P, S>, P, S> {
    // lets a settled onConfirm/onCancel Promise tell the popup was closed (maybe reopened) while pending
    #closeCount = 0;

    #isOpen() {
        return Boolean(this.isControlledComponent('visible') ? this.getProps().visible : this.getStates().visible);
    }

    #closeIfUnchanged(closeCountAtStart: number) {
        if (closeCountAtStart === this.#closeCount && this.#isOpen()) {
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
            this.adapter.updateCancelLoading(true);
            maybePromise.then(
                () => {
                    this.#closeIfUnchanged(closeCountAtStart);
                    this.adapter.updateCancelLoading(false);
                },
                () => {
                    this.adapter.updateCancelLoading(false);
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
            this.adapter.updateConfirmLoading(true);
            maybePromise.then(
                () => {
                    this.adapter.updateConfirmLoading(false);
                    this.#closeIfUnchanged(closeCountAtStart);
                },
                () => {
                    this.adapter.updateConfirmLoading(false);
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
            this.adapter.setVisible(visible);
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
        // recorded like a requested close, so dropping control cannot revive it
        this.adapter.setVisible(false);
        this.#closeCount++;
        this.adapter.focusPrevFocusElement();
    };
}
