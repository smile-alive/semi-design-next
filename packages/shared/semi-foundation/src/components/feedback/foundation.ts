import { BaseFoundation, type DefaultAdapter } from '../../base/index';
import { isPromise } from '../../utils/index';
import type { CheckboxValue } from '../checkbox/checkbox-group-foundation';
import type { RadioChangeEvent } from '../radio/radio-foundation';

export interface EmojiResult {
    emoji?: string;
    text?: string;
}

export type FeedbackValue = CheckboxValue | CheckboxValue[] | EmojiResult;

/** Nothing chosen: null, undefined, an empty string or an empty array. 0 and false are real radio values. */
export function isFeedbackValueEmpty(value?: FeedbackValue | null) {
    return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}

export interface FeedbackContentValues {
    text: string;
    radio?: CheckboxValue;
    checkbox: CheckboxValue[];
    emoji?: string;
}

type PromiseStatus = 'pending' | 'fulfilled' | 'rejected';

export interface FeedbackBaseState {
    value: FeedbackValue | null;
    onOKReturnPromiseStatus?: PromiseStatus;
    onCancelReturnPromiseStatus?: PromiseStatus;
}

/**
 * The host's event types, which the foundation only passes on to the callbacks: CE for cancel, OE for ok, TE for a
 * text area change
 */
export interface FeedbackAdapter<P extends object = object, CE = unknown, OE = unknown, TE = unknown> extends DefaultAdapter<P, FeedbackBaseState> {
    notifyValueChange(value: FeedbackValue): void;
    notifyCancel: (e: CE) => void | Promise<any>;
    notifyOk: (e: OE) => void | Promise<any>;
    notifyTextAreaChange: (value: string, e: TE) => void;
    notifyCheckboxChange: (value: CheckboxValue[]) => void;
    notifyRadioChange: (e: RadioChangeEvent) => void;
}

export default class FeedbackFoundation<P extends object = object, CE = unknown, OE = unknown, TE = unknown> extends BaseFoundation<FeedbackAdapter<P, CE, OE, TE>, P, FeedbackBaseState> {
    #changeValue(value: FeedbackValue) {
        this.setState({ value });
        this.adapter.notifyValueChange(value);
    }

    // The footer buttons show the pending state from `onOKReturnPromiseStatus` and `onCancelReturnPromiseStatus`; the
    // value clears once the handler settles. A rejection is rethrown, so the caller still sees it; Modal gets the
    // returned Promise, and nothing for a handler that returned no Promise.
    #settle(result: void | Promise<any>, report: (status: PromiseStatus) => void) {
        if (!isPromise(result)) {
            this.setState({ value: null });
            return undefined;
        }
        report('pending');
        return (result as Promise<any>).then(
            () => {
                report('fulfilled');
                this.setState({ value: null });
            },
            (e) => {
                report('rejected');
                throw e;
            }
        );
    }

    #reportOk = (onOKReturnPromiseStatus: PromiseStatus) => this.setState({ onOKReturnPromiseStatus });

    #reportCancel = (onCancelReturnPromiseStatus: PromiseStatus) => this.setState({ onCancelReturnPromiseStatus });

    static getInitialState(): FeedbackBaseState {
        return { value: null, onOKReturnPromiseStatus: 'fulfilled', onCancelReturnPromiseStatus: 'fulfilled' };
    }

    /** What each built-in content shows of the value; null (submitted or cancelled) and another type's shape show nothing chosen */
    static getContentValues(value: FeedbackValue | null): FeedbackContentValues {
        return {
            text: typeof value === 'string' ? value : '',
            radio: typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : undefined,
            checkbox: Array.isArray(value) ? value : [],
            emoji: value !== null && typeof value === 'object' && !Array.isArray(value) ? value.emoji : undefined,
        };
    }

    handleRadioChange = (e: RadioChangeEvent) => {
        const { value } = e.target;
        this.adapter.notifyRadioChange(e);
        this.#changeValue(value);
    };

    handleEmojiReasonChange = (value: string, e?: TE) => {
        this.adapter.notifyTextAreaChange(value, e);
        const oldValue = this.getState('value');
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
        void this.#settle(this.adapter.notifyCancel(e), this.#reportCancel);
    };

    handleSubmit = (e: OE) => {
        void this.#settle(this.adapter.notifyOk(e), this.#reportOk);
    };

    handleModalOk = (e: OE) => this.#settle(this.adapter.notifyOk(e), this.#reportOk);

    handleModalCancel = (e: CE) => this.#settle(this.adapter.notifyCancel(e), this.#reportCancel);
}
