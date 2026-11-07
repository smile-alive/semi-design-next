import { type Emitter, disposeEmitter, getEmitter } from '../common/emitter';
import type { GlobalEvents } from '../common/emitter-events';
import { setCurrentNameSpaceId } from '../common/name-space';
import { createModel } from '../model';
import type { JSONModel } from '../model/json-model';
import type { CompletionItem } from '../service/json-types';
import { View } from '../view/view';
import { type JsonWorkerManager, disposeWorkerManager, getJsonWorkerManager } from '../worker/json-worker-manager';
export interface JsonViewerOptions {
    lineHeight?: number;
    autoWrap?: boolean;
    readOnly?: boolean;
    formatOptions?: FormattingOptions;
    completionOptions?: CompletionOptions;
    customRenderRule?: CustomRenderRule[];
    prefixCls?: string;
    /** Accessible name of the content area: the read-only scroll region, or the editable textbox */
    ariaLabel?: string;
}

export interface CompletionOptions {
    staticCompletions?: CompletionItem[];
}

export interface FormattingOptions {
    tabSize?: number;
    insertSpaces?: boolean;
    eol?: string;
}

export type TokenRenderType = 'key' | 'value';

export interface CustomRenderRule {
    /**
     * Match rule
     * - string / RegExp: matches against the textual content (string tokens are unquoted)
     * - function: receives the parsed primitive value (number/boolean/null/string), path, and token type ('key' or 'value')
     */
    match: string | RegExp | ((value: string | number | boolean | null, pathChain: string, tokenType: TokenRenderType) => boolean);
    /**
     * Render result can be a DOM element or any value that will be handled by upper layer (e.g. React portal)
     */
    render: (value: string) => any;
}

export class JsonViewer {
    #jsonModel: JSONModel;
    #view: View;
    #jsonWorkerManager: JsonWorkerManager | null = null;
    #id: string = `jsonviewer-${Math.random().toString(36).slice(2, 11)}`;
    emitter: Emitter<GlobalEvents>;

    constructor(container: HTMLElement, value: string, options?: JsonViewerOptions) {
        setCurrentNameSpaceId(this.#id);
        this.emitter = getEmitter();
        this.#jsonModel = createModel(value);
        this.#jsonWorkerManager = getJsonWorkerManager();
        void this.#jsonWorkerManager.init(value);
        this.#view = new View(container, this.#jsonModel, options);
    }

    layout() {
        this.#view.layout();
    }

    resetMeasuredHeights() {
        this.#view.resetMeasuredHeights();
    }

    getModel() {
        return this.#jsonModel;
    }

    getSearchWidget() {
        return this.#view.searchWidget;
    }

    format() {
        this.#view.editWidget.format();
    }

    dispose() {
        disposeEmitter(this.#id);
        disposeWorkerManager(this.#id);
        this.#view.dispose();
    }
}
