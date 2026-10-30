import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { CheckboxValue } from '../checkbox/checkbox-group-foundation';
import type { RadioChangeEvent } from '../radio/radio-foundation';
import isPromise from '../utils/is-promise';

export interface EmojiResult {
    emoji?: string;
    text?: string;
}

export type FeedbackValue = CheckboxValue | CheckboxValue[] | EmojiResult;

/** Nothing chosen: null, undefined, an empty string or an empty array. 0 and false are real radio values. */
export function isFeedbackValueEmpty(value?: FeedbackValue | null) {
    return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}

type PromiseStatus = 'pending' | 'fulfilled' | 'rejected';

/** The state the foundation reads with getState */
export interface FeedbackBaseState {
    value: FeedbackValue | null;
    onOKReturnPromiseStatus?: PromiseStatus;
    onCancelReturnPromiseStatus?: PromiseStatus;
}

/**
 * The host's event types, which the foundation only passes on to the callbacks: CE for cancel, OE for ok, TE for a
 * text area change
 */
export interface FeedbackAdapter<P extends object = object, S extends FeedbackBaseState = FeedbackBaseState, CE = unknown, OE = unknown, TE = unknown> extends DefaultAdapter<P, S> {
    setValue(value: FeedbackValue | null): void;
    notifyValueChange(value: FeedbackValue): void;
    notifyCancel: (e: CE) => void | Promise<any>;
    notifyOk: (e: OE) => void | Promise<any>;
    notifyTextAreaChange: (value: string, e: TE) => void;
    notifyCheckboxChange: (value: CheckboxValue[]) => void;
    notifyRadioChange: (e: RadioChangeEvent) => void;
}

export default class FeedbackFoundation<P extends object = object, S extends FeedbackBaseState = FeedbackBaseState, CE = unknown, OE = unknown, TE = unknown> extends BaseFoundation<FeedbackAdapter<P, S, CE, OE, TE>, P, S> {
    #changeValue(value: FeedbackValue) {
        this.adapter.setValue(value);
        this.adapter.notifyValueChange(value);
    }

    // The footer buttons of the popup report the pending state themselves; the value clears once the handler settles.
    // A rejection is rethrown, so the caller still sees it.
    #settlePopup(result: void | Promise<any>, report: (status: PromiseStatus) => void) {
        if (!isPromise(result)) {
            this.adapter.setValue(null);
            return;
        }
        report('pending');
        (result as Promise<any>)
            .then(() => {
                report('fulfilled');
                this.adapter.setValue(null);
            })
            .catch((e) => {
                report('rejected');
                throw e;
            });
    }

    // Modal shows the pending state on its own buttons from the promise it gets back
    #settleModal(result: void | Promise<any>) {
        if (!isPromise(result)) {
            this.adapter.setValue(null);
            return null;
        }
        return (result as Promise<any>).then(() => this.adapter.setValue(null));
    }

    handleRadioChange = (e: RadioChangeEvent) => {
        const { value } = e.target;
        this.adapter.notifyRadioChange(e);
        this.#changeValue(value);
    };

    handleEmojiReasonChange = (value: string, e?: TE) => {
        this.adapter.notifyTextAreaChange(value, e);
        const oldValue = this.adapter.getState('value');
        // the emoji picked earlier; a string or checkbox value has none
        const emoji = typeof oldValue === 'object' && !Array.isArray(oldValue) ? oldValue?.emoji : undefined;
        this.#changeValue({ ...(emoji !== undefined && { emoji }), text: value });
    };

    handleTextChange = (value: string, e?: TE) => {
        this.adapter.notifyTextAreaChange(value, e);
        this.#changeValue(value);
    };

    handleEmojiChange = (emoji: string) => {
        this.#changeValue({ emoji });
    };

    handleCheckboxChange = (value: CheckboxValue[]) => {
        this.adapter.notifyCheckboxChange(value);
        this.#changeValue(value);
    };

    handleCancel = (e: CE) => {
        this.#settlePopup(this.adapter.notifyCancel(e), (onCancelReturnPromiseStatus) => this.adapter.setState({ onCancelReturnPromiseStatus }));
    };

    handleSubmit = (e: OE) => {
        this.#settlePopup(this.adapter.notifyOk(e), (onOKReturnPromiseStatus) => this.adapter.setState({ onOKReturnPromiseStatus }));
    };

    handleModalOk = (e: OE) => {
        return this.#settleModal(this.adapter.notifyOk(e));
    };

    handleModalCancel = (e: CE) => {
        return this.#settleModal(this.adapter.notifyCancel(e));
    };
}
