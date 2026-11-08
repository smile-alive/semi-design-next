import { ENTER_KEY, isComposing } from '../../utils/key-code';
import TextEntryFoundation, { type TextEntryAdapter, type TextEntryBaseProps, type TextEntryBaseState } from './text-entry-foundation';

export interface InputBaseProps extends TextEntryBaseProps {
    mode?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    // not a declared Input prop: a lowercase `autofocus` passed through to the DOM is honored too
    autofocus?: boolean;
}

export interface InputBaseState extends TextEntryBaseState {
    isFocus: boolean;
    eyeClosed: boolean;
}

/** The members of a keyboard event the foundation reads; DOM events and React synthetic events both satisfy it */
export type InputKeyEvent = Pick<KeyboardEvent, 'key'> & Parameters<typeof isComposing>[0];

/**
 * The host's event types, which the foundation passes on to the callbacks: KE for keydown, keyup and Enter, CE for
 * composition, IE for input. The clear event is not typed: it is the clear button's click, which handleClear passes
 * to onChange and then to onClear.
 */
export interface InputAdapter<P extends InputBaseProps = InputBaseProps, KE = unknown, CE = unknown, IE = unknown> extends TextEntryAdapter<P, InputBaseState, CE> {
    notifyClear(e: any): void;
    notifyBlur(value: string | number, e: any): void;
    focusInput(): void;
    notifyInput(e: IE): void;
    notifyKeyDown(e: KE): void;
    notifyKeyUp(e: KE): void;
    notifyEnterPress(e: KE): void;
    isEventTarget(e: Pick<Event, 'target' | 'currentTarget'>): boolean;
}

export default class InputFoundation<P extends InputBaseProps = InputBaseProps, KE extends InputKeyEvent = InputKeyEvent, CE = unknown, IE = unknown> extends TextEntryFoundation<InputAdapter<P, KE, CE, IE>, P, InputBaseState, CE> {
    static override readonly propKeys = ['value', 'mode'];

    // focused by hand, not the native attribute, so preventScroll takes effect
    protected override initOnce() {
        const { disabled, autoFocus, autofocus } = this.getProps();
        if (!disabled && (autoFocus || autofocus)) {
            this.adapter.focusInput();
        }
    }

    static getInitialState(props: Pick<InputBaseProps, 'value' | 'defaultValue' | 'mode'>): InputBaseState {
        return {
            value: props.value === undefined ? props.defaultValue : props.value,
            cachedValue: props.value,
            isFocus: false,
            eyeClosed: props.mode === 'password',
        };
    }

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

    // `value` going back to undefined (a form reset) empties the text; a mode change alone must not rewrite the text,
    // which may hold an IME composition in progress
    override handlePropsChange(prev: Partial<P>) {
        const { value, mode } = this.getProps();
        if (prev.value !== value) {
            this.setState({ value, cachedValue: value });
        }
        if (prev.mode !== mode) {
            this.setState({ eyeClosed: mode === 'password' });
        }
    }

    handleClear = (e: unknown) => {
        const value = '';
        if (!this.isControlledComponent('value')) {
            this.setState({ value });
        }

        this.adapter.notifyChange(value, e);
        this.adapter.notifyClear(e);
    };

    handleClick = (e: Pick<Event, 'target' | 'currentTarget'>) => {
        const { disabled } = this.getProps();
        const { isFocus } = this.getStates();
        if (disabled || isFocus) {
            return;
        }
        if (this.adapter.isEventTarget(e)) {
            this.adapter.focusInput();
            this.setState({ isFocus: true });
        }
    };

    handleClickEye = () => {
        const eyeClosed = this.getState('eyeClosed');
        this.adapter.focusInput();
        this.setState({ isFocus: true, eyeClosed: !eyeClosed });
    };

    handleBlur = (e: unknown) => {
        const { value } = this.getStates();
        this.setState({ isFocus: false });
        this.adapter.notifyBlur(value, e);
    };

    handleInput = (e: IE) => {
        this.adapter.notifyInput(e);
    };

    handleKeyDown = (e: KE) => {
        this.adapter.notifyKeyDown(e);
        if (e.key === ENTER_KEY && !isComposing(e)) {
            this.adapter.notifyEnterPress(e);
        }
    };

    handleKeyUp = (e: KE) => {
        this.adapter.notifyKeyUp(e);
    };

    handleClickPrefixOrSuffix = () => {
        const { disabled } = this.getProps();
        const { isFocus } = this.getStates();
        if (!disabled && !isFocus) {
            this.adapter.focusInput();
            this.setState({ isFocus: true });
        }
    };
}
