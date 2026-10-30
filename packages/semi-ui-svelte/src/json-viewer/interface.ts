import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type JsonViewerFoundation from '@fibrae/semi-foundation/json-viewer/foundation';
import type { JsonViewerOptions as CoreOptions, SearchOptions, TokenRenderType } from '@fibrae/semi-foundation/json-viewer/foundation';

export type JsonViewerSearchOptions = SearchOptions;

export interface JsonViewerCustomRenderRule {
    /** string and RegExp match the token text (string tokens unquoted); a function gets the parsed value */
    match: string | RegExp | ((value: string | number | boolean | null, path: string, tokenType: TokenRenderType) => boolean);
    /** Tells rules apart in the `customRender` snippet, which also gets the rule's index */
    name?: string;
}

export interface JsonViewerOptions extends Omit<CoreOptions, 'customRenderRule' | 'prefixCls'> {
    customRenderRule?: JsonViewerCustomRenderRule[];
}

export interface JsonViewerCustomRenderArgs {
    /** The matched rule */
    item: JsonViewerCustomRenderRule;
    /** Its index in options.customRenderRule */
    index: number;
    /** The token text; a string token includes its quotes */
    content: string;
}

export interface JsonViewerSearchButtonArgs {
    /** The default search button, drawn with `{@render defaultButton()}` */
    defaultButton: Snippet;
    showSearchBar: boolean;
    onToggleSearchBar: () => void;
    onSearch: (text: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) => void;
    onPrevSearch: () => void;
    onNextSearch: () => void;
    onReplace: (text: string) => void;
    onReplaceAll: (text: string) => void;
}

// the editor owns the root's content, so children would clash with it
export interface JsonViewerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'> {
    /** Bindable; the editor's text. A value different from the editor's current text re-creates the editor */
    value?: string;
    width?: number | string;
    height?: number | string;
    showSearch?: boolean;
    options?: JsonViewerOptions;
    /** Whether to limit the search button drag bounds within the JsonViewer container */
    limitSearchButtonBounds?: boolean;
    onChange?: (value: string) => void;
    /**
     * Replaces the content of a token matched by `options.customRenderRule`. A snippet that draws nothing leaves the
     * token's text in place, decided once when the token is laid out.
     */
    customRender?: Snippet<[JsonViewerCustomRenderArgs]>;
    /** Replaces the search button; draws the default one through `defaultButton` */
    searchButton?: Snippet<[JsonViewerSearchButtonArgs]>;
}

export interface JsonViewerHandle {
    getValue: () => string;
    format: () => void;
    search: (searchText: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) => void;
    getSearchResults: () => ReturnType<JsonViewerFoundation['getSearchResults']>;
    prevSearch: (step?: number) => void;
    nextSearch: (step?: number) => void;
    replace: (replaceText: string) => void;
    replaceAll: (replaceText: string) => void;
    getStyle: () => { width: number | string; height: number | string };
}
