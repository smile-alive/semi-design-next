import { isEqual } from 'es-toolkit';
import { type JsonViewerOptions, type CustomRenderRule, type TokenRenderType, JsonViewer } from '@fibrae/semi-json-viewer-core';
import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { cssClasses } from './constants';
export type { JsonViewerOptions, CustomRenderRule, TokenRenderType };

// the core exports no FindMatch type
type SearchResults = NonNullable<ReturnType<JsonViewer['getSearchWidget']>['searchResults']>;

export interface SearchOptions {
    caseSensitive: boolean;
    wholeWord: boolean;
    regex: boolean;
}

export interface JsonViewerBaseProps {
    value: string;
    options?: JsonViewerOptions;
}

export interface JsonViewerBaseState {
    searchOptions: SearchOptions;
    showSearchBar: boolean;
}

export interface JsonViewerAdapter<P extends JsonViewerBaseProps = JsonViewerBaseProps> extends DefaultAdapter<P, JsonViewerBaseState> {
    getEditorRef: () => HTMLElement;
    notifyChange: (value: string) => void;
    /** Turns the `options` prop into what the editor takes: a host draws a custom render rule's result its own way */
    toCoreOptions: (options: JsonViewerOptions) => JsonViewerOptions;
    setCustomRenderMap: (customRenderMap: Map<HTMLElement, any>) => void;
}

const defaultSearchOptions: SearchOptions = { caseSensitive: false, wholeWord: false, regex: false };

export default class JsonViewerFoundation<P extends JsonViewerBaseProps = JsonViewerBaseProps> extends BaseFoundation<JsonViewerAdapter<P>, P, JsonViewerBaseState> {
    #resizeObserver: ResizeObserver | null = null;
    #resizeRafId: number | null = null;
    #lastObservedSize = { width: 0, height: 0 };
    // a width change and a height change coalesced into one frame still reset the measured heights
    #resetMeasuredHeights = false;
    #lastSearch: { text: string; caseSensitive: boolean; wholeWord: boolean; regex: boolean } | null = null;
    #appliedOptions: JsonViewerOptions | undefined;

    static override readonly propKeys = ['value', 'options'];

    // options is usually a fresh literal, so compare deeply
    static override readonly propEquals = { options: isEqual };

    jsonViewer: JsonViewer | null = null;

    #observeResize() {
        const el = this.adapter.getEditorRef();
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        this.#lastObservedSize = { width: rect.width, height: rect.height };
        this.#resizeObserver = new ResizeObserver((entries) => {
            // border box to match getBoundingClientRect; contentRect excludes padding
            const { inlineSize: width, blockSize: height } = entries[0].borderBoxSize[0];
            const last = this.#lastObservedSize;
            const rewrap = Boolean(this.getProps().options?.autoWrap) && Math.abs(width - last.width) >= 0.5;
            if (!rewrap && Math.abs(height - last.height) < 0.5) {
                return;
            }
            this.#lastObservedSize = { width, height };
            this.#resetMeasuredHeights ||= rewrap;
            if (this.#resizeRafId !== null) {
                cancelAnimationFrame(this.#resizeRafId);
            }
            this.#resizeRafId = requestAnimationFrame(() => {
                this.#resizeRafId = null;
                // wrapped line heights were measured at the old width
                if (this.#resetMeasuredHeights) {
                    this.jsonViewer?.resetMeasuredHeights();
                }
                this.#resetMeasuredHeights = false;
                this.jsonViewer?.layout();
            });
        });
        this.#resizeObserver.observe(el);
    }

    #searchAgain() {
        if (this.#lastSearch) {
            const { text, caseSensitive, wholeWord, regex } = this.#lastSearch;
            this.jsonViewer?.getSearchWidget().search(text, caseSensitive, wholeWord, regex);
        }
    }

    static getInitialState(): JsonViewerBaseState {
        return { searchOptions: defaultSearchOptions, showSearchBar: false };
    }

    override init() {
        const props = this.getProps();
        const editorRef = this.adapter.getEditorRef();
        this.#appliedOptions = props.options;
        this.jsonViewer = new JsonViewer(editorRef, props.value, {
            prefixCls: cssClasses.PREFIX,
            ...this.adapter.toCoreOptions(props.options),
        });
        this.jsonViewer.emitter.on('customRender', (e) => {
            this.adapter.setCustomRenderMap(e.customRenderMap);
        });
        this.jsonViewer.layout();
        // a rebuilt editor starts without results, while the search bar still shows its query
        this.#searchAgain();
        this.jsonViewer.emitter.on('contentChanged', () => {
            this.adapter.notifyChange(this.jsonViewer?.getModel().getValue());
            // a search made through the handle has no bar open, yet its results must follow the edit
            this.#searchAgain();
        });
        this.#observeResize();
    }

    override destroy() {
        this.#resizeObserver?.disconnect();
        this.#resizeObserver = null;
        if (this.#resizeRafId !== null) {
            cancelAnimationFrame(this.#resizeRafId);
            this.#resizeRafId = null;
        }
        this.#resetMeasuredHeights = false;
        this.jsonViewer?.dispose();
        this.jsonViewer = null;
        // a re-created editor without rules never emits customRender, so the stale spans must be cleared here
        this.adapter.setCustomRenderMap(new Map());
    }

    override handlePropsChange() {
        this.syncEditor();
    }

    /**
     * Re-creates the editor unless it already shows `value` under the applied `options`. A value equal to the editor's
     * own text is the echo of an onChange write-back: re-creating would drop the caret, focus, undo stack and scroll
     * position. Does nothing while there is no editor.
     */
    syncEditor = () => {
        if (!this.jsonViewer) {
            return;
        }
        if (isEqual(this.getProp('options'), this.#appliedOptions) && this.getProp('value') === this.jsonViewer.getModel().getValue()) {
            return;
        }
        this.destroy();
        this.init();
    };

    search = (searchText: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) => {
        let options;
        if (caseSensitive !== undefined || wholeWord !== undefined || regex !== undefined) {
            options = {
                caseSensitive: caseSensitive ?? false,
                wholeWord: wholeWord ?? false,
                regex: regex ?? false,
            };
        } else {
            options = this.getState('searchOptions');
        }
        // the search input may not exist (custom UI or closed bar), so edits re-search from this record
        this.#lastSearch = { text: searchText, ...options };
        this.jsonViewer?.getSearchWidget().search(searchText, options.caseSensitive, options.wholeWord, options.regex);
    };

    prevSearch = (step?: number) => {
        if (step === undefined) {
            this.jsonViewer?.getSearchWidget().navigateResults(-1);
        } else {
            this.jsonViewer?.getSearchWidget().navigateResults(-step);
        }
    };

    nextSearch = (step?: number) => {
        if (step === undefined) {
            this.jsonViewer?.getSearchWidget().navigateResults(1);
        } else {
            this.jsonViewer?.getSearchWidget().navigateResults(step);
        }
    };

    replace = (replaceText: string) => {
        if (this.getProps().options?.readOnly) {
            return;
        }
        this.jsonViewer?.getSearchWidget().replace(replaceText);
    };

    replaceAll = (replaceText: string) => {
        if (this.getProps().options?.readOnly) {
            return;
        }
        this.jsonViewer?.getSearchWidget().replaceAll(replaceText);
    };

    toggleSearchOption = (key: keyof SearchOptions) => {
        const searchOptions = this.getState('searchOptions');
        this.setState({ searchOptions: { ...searchOptions, [key]: !searchOptions[key] } });
        this.search(this.#lastSearch?.text ?? '');
    };

    /** Also resets the search options */
    toggleSearchBar = () => {
        // a reopened bar starts with an empty input, so old results and highlights go too
        this.#lastSearch = null;
        this.jsonViewer?.getSearchWidget().clear();
        this.setState({ showSearchBar: !this.getState('showSearchBar'), searchOptions: defaultSearchOptions });
    };

    /** `null` when nothing was searched (or the bar was closed), `undefined` while there is no editor */
    getSearchResults = (): SearchResults | null | undefined => {
        return this.jsonViewer?.getSearchWidget().searchResults;
    };
}
