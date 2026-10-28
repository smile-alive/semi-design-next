import { ENTER_KEY, isComposing } from './../utils/key-code';
import { strings } from './constants';
import TextEntryFoundation, { type TextEntryAdapter, type TextEntryBaseProps, type TextEntryBaseState } from './text-entry-foundation';

/** The props the foundation reads with getProps */
export interface InputBaseProps extends TextEntryBaseProps {
    disabled?: boolean;
    autoFocus?: boolean;
    // not a declared Input prop: a lowercase `autofocus` passed through to the DOM is honored too
    autofocus?: boolean;
}

export interface InputBaseState extends TextEntryBaseState {
    isFocus?: boolean;
    eyeClosed?: boolean;
}

/** The members of a keyboard event the foundation reads; DOM events and React synthetic events both satisfy it */
export type InputKeyEvent = Pick<KeyboardEvent, 'key'> & Parameters<typeof isComposing>[0];

/**
 * The host's event types, which the foundation passes on to the callbacks: KE for keydown, keyup and Enter, CE for
 * composition, IE for input. The clear event is not typed: handleClear marks it for DateInput.
 */
export interface InputAdapter<P extends InputBaseProps = InputBaseProps, S extends InputBaseState = InputBaseState, KE = unknown, CE = unknown, IE = unknown> extends TextEntryAdapter<P, S, CE> {
    notifyClear(e: any): void;
    notifyBlur(value: string | number, e: any): void;
    setEyeClosed(eyeClosed: boolean): void;
    focusInput(): void;
    notifyInput(e: IE): void;
    notifyKeyDown(e: KE): void;
    notifyKeyUp(e: KE): void;
    notifyEnterPress(e: KE): void;
    isEventTarget(e: Pick<Event, 'target' | 'currentTarget'>): boolean;
}

export default class InputFoundation<P extends InputBaseProps = InputBaseProps, S extends InputBaseState = InputBaseState, KE extends InputKeyEvent = InputKeyEvent, CE = unknown, IE = unknown> extends TextEntryFoundation<InputAdapter<P, S, KE, CE, IE>, P, S, CE> {
    // StrictMode and React Activity replay init on this instance after destroy: autoFocus belongs to the first mount
    #initialized = false;

    /** Whether the clear button is rendered; the stylesheet shows it on hover and while focus is inside */
    static isAllowClear(props: { showClear?: boolean; disabled?: boolean; readonly?: boolean; showClearIgnoreDisabled?: boolean }, value?: string | number) {
        return Boolean(value != null && value !== '' && props.showClear && !props.readonly && (!props.disabled || props.showClearIgnoreDisabled));
    }

    static getInputType(type: string, mode: string | undefined, eyeClosed: boolean) {
        if (mode === 'password') {
            return eyeClosed ? 'password' : 'text';
        }
        return type;
    }

    // focused by hand, not the native attribute, so preventScroll takes effect
    override init() {
        if (this.#initialized) {
            return;
        }
        this.#initialized = true;
        const { disabled, autoFocus, autofocus } = this.getProps();
        if (!disabled && (autoFocus || autofocus)) {
            this._adapter.focusInput();
        }
    }

    handleValueChange(value: string | number) {
        this._adapter.setState({ value, cachedValue: value });
    }

    handleClear(e: any) {
        let eventObj = e;
        const value = '';
        if (!this._isControlledComponent('value')) {
            this._adapter.setValue(value);
        }

        if (!eventObj || typeof eventObj !== 'object') {
            eventObj = {};
        }

        eventObj[strings.CLEARBTN_CLICKED_EVENT_FLAG] = true; // read by DateInput

        this._adapter.notifyChange(value, eventObj);
        this._adapter.notifyClear(eventObj);
    }

    handleClick(e: Pick<Event, 'target' | 'currentTarget'>) {
        const { disabled } = this._adapter.getProps();
        const { isFocus } = this._adapter.getStates();
        if (disabled || isFocus) {
            return;
        }
        if (this._adapter.isEventTarget(e)) {
            this._adapter.focusInput();
            this._adapter.toggleFocusing(true);
        }
    }

    handleModeChange(mode: string) {
        if (mode === 'password') {
            this._adapter.setEyeClosed(true);
        } else {
            this._adapter.setEyeClosed(false);
        }
    }

    handleClickEye() {
        const eyeClosed = this._adapter.getState('eyeClosed');
        this._adapter.focusInput();
        this._adapter.toggleFocusing(true);
        this._adapter.setEyeClosed(!eyeClosed);
    }

    handleBlur(e: unknown) {
        const { value } = this.getStates();
        this._adapter.toggleFocusing(false);
        this._adapter.notifyBlur(value, e);
    }

    handleInput(e: IE) {
        this._adapter.notifyInput(e);
    }

    handleKeyDown(e: KE) {
        this._adapter.notifyKeyDown(e);
        if (e.key === ENTER_KEY && !isComposing(e)) {
            this._adapter.notifyEnterPress(e);
        }
    }

    handleKeyUp(e: KE) {
        this._adapter.notifyKeyUp(e);
    }

    handleClickPrefixOrSuffix() {
        const { disabled } = this._adapter.getProps();
        const { isFocus } = this._adapter.getStates();
        if (!disabled && !isFocus) {
            this._adapter.focusInput();
            this._adapter.toggleFocusing(true);
        }
    }
}
