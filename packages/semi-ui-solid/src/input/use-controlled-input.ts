import type { Accessor } from 'solid-js';

interface TextEntry {
    handleChange(value: string, e: unknown): void;
    handleCompositionEnd(e: unknown): void;
    handleFocus(e: unknown): void;
    handleBlur(e: unknown): void;
    getProp(key: 'composition'): unknown;
}

interface Options {
    element: Accessor<HTMLInputElement | HTMLTextAreaElement | undefined>;
    /** The text the element should show */
    text: Accessor<string>;
    foundation: TextEntry;
    state: Accessor<{ isFocus: boolean }>;
    allowClear: Accessor<boolean>;
    clearButton: Accessor<HTMLButtonElement | undefined>;
}

type FocusHandlerEvent = FocusEvent & { currentTarget: HTMLElement };

/** Keeps the native element showing the controlled text, and the wrapper's focus state, for Input and TextArea */
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

    let reported: string | undefined;

    /** The host notifies its own input listeners before this */
    const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => {
        reported = e.currentTarget.value;
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
        foundation.handleCompositionEnd(e);
        // Firefox fires compositionend before the input event that reports the committed text; writing back now would
        // replace it with the stale controlled text, so that input event writes back instead. `composition` reports
        // the text here
        if (foundation.getProp('composition') || element()?.value === reported) {
            syncValue();
        }
    };

    // the handover after a removed clear button comes in with no relatedTarget, so the focus state tells it apart
    const handleFocusIn = (e: FocusHandlerEvent) => {
        if (!state().isFocus && !e.currentTarget.contains(e.relatedTarget as Node | null)) {
            foundation.handleFocus(e);
        }
    };

    /** `afterBlur` runs when focus leaves the wrapper, after the foundation's blur */
    const handleFocusOut = (e: FocusHandlerEvent, afterBlur?: () => void) => {
        // Chrome blurs a focused node as an update removes it; the clear button hands focus back to the input then
        if (e.target === clearButton() && !allowClear()) {
            return;
        }
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            foundation.handleBlur(e);
            afterBlur?.();
        }
    };

    return { syncValue, handleInput, handleCompositionEnd, handleFocusIn, handleFocusOut };
}
