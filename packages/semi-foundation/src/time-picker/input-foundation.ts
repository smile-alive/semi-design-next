import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

export type TimeInputState = Record<string, never>;

/** `E` is the focus and blur event of the host framework, which the foundation only passes on */
export interface TimeInputAdapter<P extends object = object, E = unknown> extends DefaultAdapter<P, TimeInputState> {
    notifyChange: (value: string) => void;
    notifyFocus: (e: E) => void;
    notifyBlur: (e: E) => void;
    getInputNode: () => HTMLInputElement | null;
}

export default class TimeInputFoundation<P extends object = object, E = unknown> extends BaseFoundation<TimeInputAdapter<P, E>, P, TimeInputState> {
    #cursorIndex: number | null = null;
    static override readonly propKeys = ['value'];

    #storeCursor() {
        const inputNode = this.adapter.getInputNode();
        if (inputNode) {
            this.#cursorIndex = inputNode.selectionStart;
        }
    }

    #clearCursor() {
        this.#cursorIndex = null;
    }

    /** Re-formatting the text moves the caret to the end; the host calls this after the input shows the new text */
    override handlePropsChange() {
        const inputNode = this.adapter.getInputNode();
        const cursorIndex = this.#cursorIndex;
        if (inputNode && cursorIndex !== null) {
            inputNode.selectionStart = cursorIndex;
            inputNode.selectionEnd = cursorIndex;
        }
    }

    handleFocus = (e: E) => {
        this.#storeCursor();
        this.adapter.notifyFocus(e);
    };

    handleChange = (v: string) => {
        this.#storeCursor();
        this.adapter.notifyChange(v);
    };

    handleBlur = (e: E) => {
        this.#clearCursor();
        this.adapter.notifyBlur(e);
    };
}
