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

/** The props the foundation reads with getProps */
export interface JsonViewerBaseProps {
    value: string;
    options?: JsonViewerOptions;
}

export interface JsonViewerBaseState {
    searchOptions: SearchOptions;
    showSearchBar: boolean;
}

export interface JsonViewerAdapter<P extends JsonViewerBaseProps = JsonViewerBaseProps, S extends JsonViewerBaseState = JsonViewerBaseState> extends DefaultAdapter<P, S> {
    getEditorRef: () => HTMLElement;
    notifyChange: (value: string) => void;
    toggleSearchOption: (key: keyof SearchOptions) => void;
    /** Shows or hides the search bar and resets the search options */
    toggleSearchBar: () => void;
    setCustomRenderMap: (customRenderMap: Map<HTMLElement, any>) => void;
}

export default class JsonViewerFoundation<P extends JsonViewerBaseProps = JsonViewerBaseProps, S extends JsonViewerBaseState = JsonViewerBaseState> extends BaseFoundation<JsonViewerAdapter<P, S>, P, S> {
    #resizeObserver: ResizeObserver | null = null;
    #resizeRafId: number | null = null;
    #lastObservedSize = { width: 0, height: 0 };
    // a width change and a height change coalesced into one frame still reset the measured heights
    #resetMeasuredHeights = false;
    #lastSearch: { text: string; caseSensitive: boolean; wholeWord: boolean; regex: boolean } | null = null;
    jsonViewer: JsonViewer | null = null;

    #observeResize() {
        const el = this._adapter.getEditorRef();
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

    override init() {
        const props = this.getProps();
        const editorRef = this._adapter.getEditorRef();
        this.jsonViewer = new JsonViewer(editorRef, props.value, {
            prefixCls: cssClasses.PREFIX,
            ...props.options,
        });
        this.jsonViewer.emitter.on('customRender', (e) => {
            this._adapter.setCustomRenderMap(e.customRenderMap);
        });
        this.jsonViewer.layout();
        // a rebuilt editor starts without results, while the search bar still shows its query
        this.#searchAgain();
        this.jsonViewer.emitter.on('contentChanged', () => {
            this._adapter.notifyChange(this.jsonViewer?.getModel().getValue());
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
        this._adapter.setCustomRenderMap(new Map());
    }

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

    /** Toggles one search option, then searches again with the input text and the new options */
    toggleSearchOption = (key: keyof SearchOptions) => {
        this._adapter.toggleSearchOption(key);
        this.search(this.#lastSearch?.text ?? '');
    };

    toggleSearchBar = () => {
        // a reopened bar starts with an empty input, so old results and highlights go too
        this.#lastSearch = null;
        this.jsonViewer?.getSearchWidget().clear();
        this._adapter.toggleSearchBar();
    };

    /** `null` when nothing was searched (or the bar was closed), `undefined` while there is no editor */
    getSearchResults = (): SearchResults | null | undefined => {
        return this.jsonViewer?.getSearchWidget().searchResults;
    };
}
