import type { Accessor } from 'solid-js';
import { crossesFocusBoundary } from '@fibrae/semi-foundation/utils/a11y';

interface TextEntry {
    handleChange(value: string, e: unknown): void;
    handleCompositionEnd(e: unknown): boolean;
    handleFocus(e: unknown): void;
    handleBlur(e: unknown): void;
}

interface Options {
    element: Accessor<HTMLInputElement | HTMLTextAreaElement | undefined>;
    text: Accessor<string>;
    foundation: TextEntry;
    state: Accessor<{ isFocus: boolean }>;
    allowClear: Accessor<boolean>;
    clearButton: Accessor<HTMLButtonElement | undefined>;
}

type FocusHandlerEvent = FocusEvent & { currentTarget: HTMLElement };

export default function useControlledInput({ element, text, foundation, state, allowClear, clearButton }: Options) {
    // Solid writes `value` only when it changes, so a value the parent rejected (an unchanged controlled prop) or
    // replaced after an IME composition is written back here; equal text is left alone, which keeps the caret
    const syncValue = () => {
        const el = element();
        const next = text();
        if (el && el.value !== next) {
            el.value = next;
        }
    };

    /** The host notifies its own input listeners before this */
    const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => {
        try {
            foundation.handleChange(e.currentTarget.value, e);
        } finally {
            // writing during an IME composition would break it; compositionend writes back
            if (!e.isComposing) {
                syncValue();
            }
        }
    };

    const handleCompositionEnd = (e: CompositionEvent) => {
        // false: Firefox reports the committed text in the input event after this one, which writes back instead
        if (foundation.handleCompositionEnd(e)) {
            syncValue();
        }
    };

    // the handover after a removed clear button comes in with no relatedTarget, so the focus state tells it apart
    const handleFocusIn = (e: FocusHandlerEvent) => {
        if (!state().isFocus) {
            foundation.handleFocus(e);
        }
    };

    /** `afterBlur` runs when focus leaves the wrapper, after the foundation's blur */
    const handleFocusOut = (e: FocusHandlerEvent, afterBlur?: () => void) => {
        // Chrome blurs a focused node as an update removes it; the clear button hands focus back to the input then
        if (e.target === clearButton() && !allowClear()) {
            return;
        }
        foundation.handleBlur(e);
        if (afterBlur && crossesFocusBoundary(e)) {
            afterBlur();
        }
    };

    return { syncValue, handleInput, handleCompositionEnd, handleFocusIn, handleFocusOut };
}
