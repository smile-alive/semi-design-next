import { nextTick, type ComputedRef, type ShallowRef } from 'vue';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import type { ModelModifiers } from './interface';
import { keepsTypedValue } from './model-modifiers';

interface TextEntry {
    handleCompositionEnd(event: CompositionEvent): void;
    handleFocus(event: FocusEvent): void;
    handleBlur(event: FocusEvent): void;
}

interface Options {
    element: Readonly<ShallowRef<HTMLInputElement | HTMLTextAreaElement | null>>;
    /** The typed value `.lazy` holds back until the native change event; the adapter's notifyChange writes it */
    draft: ShallowRef<string | undefined>;
    props: { modelValue?: string | number; modelModifiers?: ModelModifiers };
    shown: ComputedRef<string | number | undefined>;
    foundation: TextEntry;
    emitUpdate: (value: string) => void;
}

/**
 * The `v-model` modifiers Input and TextArea share: the `.lazy` draft, and the text a `.trim` or `.number` model or a
 * rejecting parent leaves in the element.
 */
export default function useTextEntry({ element, draft, props, shown, foundation, emitUpdate }: Options) {
    // Both the value binding and restoreShownValue write this, so every render keeps a typed value the model normalised
    const elementText = () => {
        const el = element.value;
        if (el && FocusTrapHandle.getActiveElement(el) === el && keepsTypedValue(el.value, props.modelValue, props.modelModifiers)) {
            return el.value;
        }
        return String(shown.value ?? '');
    };

    // A parent that rejects the new value (one-way binding) re-renders nothing, so Vue never patches the typed text away;
    // restoring after the flush leaves an accepted edit and its caret untouched.
    const restoreShownValue = () =>
        nextTick(() => {
            const text = elementText();
            if (element.value && element.value.value !== text) {
                element.value.value = text;
            }
        });

    /** `change` hands the text to the foundation; the host decides where its own `input` emit goes around it */
    const runInput = (event: Event, change: () => void) => {
        // a composition step only reaches state.value; without this the stale draft would be patched back over the text
        if (draft.value !== undefined) {
            draft.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
        }
        change();
        // writing during an IME composition would break it; compositionend restores
        if (!(event as InputEvent).isComposing) {
            void restoreShownValue();
        }
    };

    const handleCompositionEnd = (event: CompositionEvent) => {
        foundation.handleCompositionEnd(event);
        void restoreShownValue();
    };

    // Native change fires on blur with an edit and on Enter, before focusout.
    const commitDraft = () => {
        if (draft.value !== undefined) {
            emitUpdate(draft.value);
            draft.value = undefined;
        }
        void restoreShownValue();
    };

    const handleFocusIn = (event: FocusEvent) => {
        if (!(event.currentTarget as Node).contains(event.relatedTarget as Node | null)) {
            foundation.handleFocus(event);
        }
    };

    const handleFocusOut = (event: FocusEvent) => {
        if (!(event.currentTarget as Node).contains(event.relatedTarget as Node | null)) {
            foundation.handleBlur(event);
            // an edit typed back to its original text fires no change, so its draft is dropped here
            draft.value = undefined;
            void restoreShownValue();
        }
    };

    return { elementText, runInput, handleCompositionEnd, commitDraft, handleFocusIn, handleFocusOut };
}
