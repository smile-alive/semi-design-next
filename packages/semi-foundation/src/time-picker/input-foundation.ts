import BaseFoundation, { type DefaultAdapter } from '../base/foundation';

/** `E` is the focus and blur event of the host framework, which the foundation only passes on */
export interface TimeInputAdapter<P extends object = object, S extends object = object, E = unknown> extends DefaultAdapter<P, S> {
    notifyChange: (value: string) => void;
    notifyFocus: (e: E) => void;
    notifyBlur: (e: E) => void;
    getInputNode: () => HTMLInputElement | null;
}

// The foundation reads no props or state
export default class TimeInputFoundation<P extends object = object, S extends object = object, E = unknown> extends BaseFoundation<TimeInputAdapter<P, S, E>, P, S> {
    #cursorIndex: number | null = null;

    #storeCursor() {
        const inputNode = this.adapter.getInputNode();
        if (inputNode) {
            this.#cursorIndex = inputNode.selectionStart;
        }
    }

    #clearCursor() {
        this.#cursorIndex = null;
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

    restoreCursor = () => {
        const inputNode = this.adapter.getInputNode();
        const cursorIndex = this.#cursorIndex;
        if (inputNode && cursorIndex !== null) {
            inputNode.selectionStart = cursorIndex;
            inputNode.selectionEnd = cursorIndex;
        }
    };
}
