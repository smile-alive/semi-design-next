import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import truncateValue from './util/truncate-value';

/** The props the shared text entry logic reads with getProps */
export interface TextEntryBaseProps {
    value?: string | number;
    composition?: boolean;
    minLength?: number;
    maxLength?: number;
    getValueLength?: (value: string) => number;
}

export interface TextEntryBaseState {
    value?: string | number;
    cachedValue?: string | number;
}

/**
 * CE is the host's composition event. The change and focus events stay untyped: the change callback also receives
 * composition and clear events, and focus is reported from the wrapper element.
 */
export interface TextEntryAdapter<P extends TextEntryBaseProps, S extends TextEntryBaseState, CE = unknown> extends DefaultAdapter<P, S> {
    setValue(value: any): void;
    notifyChange(value: string, e: any): void;
    toggleFocusing(focused: boolean): void;
    notifyFocus(value: string | number, e: any): void;
    notifyCompositionStart(e: CE): void;
    notifyCompositionEnd(e: CE): void;
    notifyCompositionUpdate(e: CE): void;
}

/**
 * What Input and TextArea share: controlled and uncontrolled value updates, IME composition, and maxLength and
 * minLength counted by `getValueLength` (so multi-unit characters such as emoji count once).
 */
export default class TextEntryFoundation<A extends TextEntryAdapter<P, S, CE>, P extends TextEntryBaseProps, S extends TextEntryBaseState, CE = unknown> extends BaseFoundation<A, P, S> {
    #compositionEnter: boolean = false;
    #composedSinceFocus = false;

    /** Whether an IME composition started since the element last took the focus */
    protected get composedSinceFocus() {
        return this.#composedSinceFocus;
    }

    protected getNextValue(value: string) {
        const { maxLength, getValueLength } = this.getProps();
        if (typeof getValueLength !== 'function') {
            return value;
        }
        return maxLength ? this.handleVisibleMaxLength(value) : value;
    }

    protected changeValue(value: string, e: unknown) {
        if (!this._isControlledComponent()) {
            this._adapter.setValue(value);
        }
        this._adapter.notifyChange(value, e);
    }

    protected handleVisibleMaxLength(value: string) {
        const { maxLength, getValueLength } = this.getProps();
        if (typeof maxLength === 'number' && maxLength >= 0) {
            if (TextEntryFoundation.getValueCount(value, getValueLength) > maxLength) {
                console.warn('[Semi] The input character is truncated because the input length exceeds the maximum length limit');
                return truncateValue({ value, maxLength, getValueLength });
            }
        }
        return value;
    }

    // the native minlength counts UTF-16 units; adding the missing characters makes the browser check
    // follow getValueLength
    static getNativeMinLength({ minLength, getValueLength }: { minLength?: number; getValueLength?: (value: string) => number }, value?: string | number) {
        if (typeof minLength !== 'number' || minLength < 0 || typeof getValueLength !== 'function') {
            return minLength;
        }
        const text = String(value ?? '');
        const valueLength = getValueLength(text);
        return valueLength < minLength ? text.length + (minLength - valueLength) : minLength;
    }

    // a changed `value` prop wins on its render; state may hold text the prop does not (IME composition in progress)
    static deriveValue<V>(props: { value?: V }, state: { value?: V; cachedValue?: V }) {
        return props.value !== state.cachedValue ? props.value : state.value;
    }

    /** The length the counter and maxLength count: `getValueLength` when given, otherwise UTF-16 units */
    static getValueCount(value?: string, getValueLength?: (value: string) => number) {
        if (!value) {
            return 0;
        }
        return typeof getValueLength === 'function' ? getValueLength(value) : value.length;
    }

    handleChange(value: string, e: unknown) {
        const { composition } = this.getProps();
        let nextValue = value;
        // composing: state must still follow, controlled or not, so the element shows the composing text
        if (composition && this.#compositionEnter) {
            this._adapter.setValue(nextValue);
            return;
        }
        if (!this.#compositionEnter) {
            nextValue = this.getNextValue(nextValue);
        }
        this.changeValue(nextValue, e);
    }

    handleCompositionStart = (e: CE) => {
        this.#compositionEnter = true;
        this.#composedSinceFocus = true;
        this._adapter.notifyCompositionStart(e);
    };

    handleCompositionEnd = (e: any) => {
        const { composition } = this.getProps();
        const value: string = e.target.value;
        this.#compositionEnter = false;
        this._adapter.notifyCompositionEnd(e);
        if (composition) {
            const nextValue = this.getNextValue(value);
            this.changeValue(nextValue, e);
            if (this._isControlledComponent()) {
                // the parent may reject the result; the value prop then does not change
                // and nothing else resets the text
                this._adapter.setValue(this.getProp('value'));
            }
            return;
        }
        const { getValueLength, maxLength } = this.getProps();
        if (typeof getValueLength !== 'function' || !maxLength) {
            return;
        }
        const nextValue = this.handleVisibleMaxLength(value);
        if (nextValue !== value) {
            this.changeValue(nextValue, e);
        }
    };

    handleCompositionUpdate = (e: CE) => {
        this._adapter.notifyCompositionUpdate(e);
    };

    handleFocus(e: unknown) {
        const { value } = this.getStates();
        this.#composedSinceFocus = false;
        this._adapter.toggleFocusing(true);
        this._adapter.notifyFocus(value, e);
    }
}
