import { fitTextareaHeight, onFontsLoaded, supportsFieldSizing } from '../utils/field-sizing';
import { ENTER_KEY, isComposing } from '../utils/key-code';
import TextEntryFoundation, { type TextEntryAdapter, type TextEntryBaseProps, type TextEntryBaseState } from './text-entry-foundation';

/** The props the foundation reads with getProps */
export interface TextAreaBaseProps extends TextEntryBaseProps {
    value?: string;
    disabled?: boolean;
    readonly?: boolean;
    disabledEnterStartNewLine?: boolean;
    autosize?: unknown;
}

export interface TextAreaBaseState extends TextEntryBaseState {
    value?: string;
    cachedValue?: string;
    isFocus?: boolean;
}

/** The members of a keyboard event the foundation reads; DOM events and React synthetic events both satisfy it */
export type TextAreaKeyEvent = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault'> & Parameters<typeof isComposing>[0];

/**
 * The host's event types: KE for keydown and Enter, CE for composition. Blur and clear stay untyped: their callbacks
 * declare a React event of the textarea.
 */
export interface TextAreaAdapter<P extends TextAreaBaseProps = TextAreaBaseProps, S extends TextAreaBaseState = TextAreaBaseState, KE = unknown, CE = unknown> extends TextEntryAdapter<P, S, CE> {
    notifyBlur(value: string, e: any): void;
    notifyKeyDown(e: KE): void;
    notifyClear(e: any): void;
    notifyEnterPress(e: KE): void;
    /** autosize changed the height (no width), or a native `resize` drag changed the size */
    notifyResize(size: { height: number; width?: number }): void;
    focusInput(): void;
    isEventTarget(e: Pick<Event, 'target' | 'currentTarget'>): boolean;
    /** The native textarea currently rendered; showLineNumber remounts it */
    getTextarea(): HTMLTextAreaElement | null;
}

export default class TextAreaFoundation<P extends TextAreaBaseProps = TextAreaBaseProps, S extends TextAreaBaseState = TextAreaBaseState, KE extends TextAreaKeyEvent = TextAreaKeyEvent, CE = unknown> extends TextEntryFoundation<TextAreaAdapter<P, S, KE, CE>, P, S, CE> {
    #resizeObserved = false;
    #lastSize: { width: number; height: number } | null = null;
    // the browser lacks CSS field-sizing, so the height is written inline
    #fitInline = false;
    #fitted = false;
    #widthObserver: ResizeObserver | null = null;
    #observed: HTMLTextAreaElement | null = null;
    #lastWidth = NaN;

    static isAllowClear(props: { showClear?: boolean; disabled?: boolean; readonly?: boolean }, value?: string) {
        return Boolean(value && props.showClear && !props.disabled && !props.readonly);
    }

    override init() {
        // decided after mount, so the server and the first client render agree
        this.#fitInline = !supportsFieldSizing();
        if (this.#fitInline) {
            onFontsLoaded(() => this.fitAutosize(), this.signal);
            this.fitAutosize();
        }
    }

    override destroy() {
        this.#widthObserver?.disconnect();
        this.#widthObserver = null;
        this.#observed = null;
        this.#fitInline = false;
    }

    /** Re-fits the inline height without field-sizing; hosts call it when the value, `autosize` or the node changes */
    fitAutosize = () => {
        const textarea = this.#fitInline ? this.adapter.getTextarea() : null;
        if (!textarea) {
            return;
        }
        if (!this.getProps().autosize) {
            if (this.#fitted) {
                textarea.style.removeProperty('height');
                this.#fitted = false;
            }
            return;
        }
        this.#fitted = true;
        fitTextareaHeight(textarea);
        if (this.#observed !== textarea) {
            // wrapping changes with the width
            this.#widthObserver ??= new ResizeObserver((entries) => {
                const { width } = entries.at(-1).contentRect;
                if (width !== this.#lastWidth) {
                    this.#lastWidth = width;
                    this.fitAutosize();
                }
            });
            this.#widthObserver.disconnect();
            this.#widthObserver.observe(textarea);
            this.#observed = textarea;
            this.#lastWidth = NaN;
        }
    };

    handleValueChange = (value: string) => {
        this.adapter.setState({ value, cachedValue: value });
    };

    handleBlur = (e: unknown) => {
        const { value } = this.getStates();
        const { maxLength } = this.getProps();
        let realValue = value;
        // blurring mid-composition commits the whole IME buffer, which may exceed maxLength; a value that only came
        // in through the prop is left to its owner
        if (maxLength && this.composedSinceFocus) {
            realValue = this.handleVisibleMaxLength(value);
            if (realValue !== value) {
                if (!this.isControlledComponent()) {
                    this.adapter.setValue(realValue);
                }
                this.adapter.notifyChange(realValue, e);
            }
        }
        this.adapter.toggleFocusing(false);
        this.adapter.notifyBlur(realValue, e);
    };

    handleKeyDown = (e: KE) => {
        const { disabledEnterStartNewLine } = this.getProps();
        if (disabledEnterStartNewLine && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
        }
        this.adapter.notifyKeyDown(e);
        if (e.key === ENTER_KEY && !isComposing(e)) {
            this.adapter.notifyEnterPress(e);
        }
    };

    // ResizeObserver reports once on observe, which is not a resize. Autosize reports the border-box height and ignores
    // width-only changes; native resize reports the content box.
    handleResize = (entries: { contentRect?: { width: number; height: number }; target?: Element }[]) => {
        const entry = entries?.[0];
        const rect = entry?.contentRect;
        if (!rect) {
            return;
        }
        const { width, height } = rect;
        const last = this.#lastSize;
        this.#lastSize = { width, height };
        if (!this.#resizeObserved) {
            this.#resizeObserved = true;
            return;
        }
        if (this.getProps().autosize) {
            if (last && last.height === height) {
                return;
            }
            this.adapter.notifyResize({ height: entry.target.getBoundingClientRect().height });
            return;
        }
        if (last && last.width === width && last.height === height) {
            return;
        }
        this.adapter.notifyResize({ height, width });
    };

    handleClear = (e: Pick<Event, 'stopPropagation'>) => {
        if (!this.isControlledComponent('value')) {
            this.adapter.setValue('');
        }
        this.adapter.notifyChange('', e);
        this.adapter.notifyClear(e);
        e.stopPropagation();
    };

    handleClick = (e: Pick<Event, 'target' | 'currentTarget'>) => {
        const { disabled, readonly } = this.adapter.getProps();
        const { isFocus } = this.adapter.getStates();
        if (disabled || readonly || isFocus) {
            return;
        }
        if (this.adapter.isEventTarget(e)) {
            this.adapter.focusInput();
            this.adapter.toggleFocusing(true);
        }
    };

    handleCounterClick = () => {
        const { disabled, readonly } = this.adapter.getProps();
        const { isFocus } = this.adapter.getStates();
        if (disabled || readonly || isFocus) {
            return;
        }
        this.adapter.focusInput();
        this.adapter.toggleFocusing(true);
    };
}
