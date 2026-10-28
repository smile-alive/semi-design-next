import type { VNode } from 'vue';
import type JsonViewerFoundation from '@fibrae/semi-foundation/json-viewer/foundation';
import type { JsonViewerOptions as CoreOptions, SearchOptions, TokenRenderType } from '@fibrae/semi-foundation/json-viewer/foundation';

export type JsonViewerSearchOptions = SearchOptions;

export interface JsonViewerCustomRenderRule {
    /** string and RegExp match the token text (string tokens unquoted); a function gets the parsed value */
    match: string | RegExp | ((value: string | number | boolean | null, path: string, tokenType: TokenRenderType) => boolean);
    /** Tells rules apart in the #customRender slot; the slot also gets the rule's index */
    name?: string;
}

export interface JsonViewerOptions extends Omit<CoreOptions, 'customRenderRule' | 'prefixCls'> {
    customRenderRule?: JsonViewerCustomRenderRule[];
}

export interface JsonViewerProps {
    /** The editor's text; a value different from the editor's current text re-creates it */
    modelValue?: string;
    width?: number | string;
    height?: number | string;
    showSearch?: boolean;
    options?: JsonViewerOptions;
    /** Whether to limit the search button drag bounds within the JsonViewer container */
    limitSearchButtonBounds?: boolean;
}

export interface JsonViewerEmits {
    'update:modelValue': [value: string];
    change: [value: string];
}

export interface JsonViewerCustomRenderSlotProps {
    /** The matched rule */
    item: JsonViewerCustomRenderRule;
    /** Its index in options.customRenderRule */
    index: number;
    /** The token text; a string token includes its quotes */
    content: string;
}

export interface JsonViewerSearchButtonSlotProps {
    /** The default search button, rendered with `<component :is>` */
    defaultButton: VNode;
    showSearchBar: boolean;
    onToggleSearchBar: () => void;
    onSearch: (text: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) => void;
    onPrevSearch: () => void;
    onNextSearch: () => void;
    onReplace: (text: string) => void;
    onReplaceAll: (text: string) => void;
}

export interface JsonViewerSlots {
    /** Replaces the content of a token matched by options.customRenderRule; without it the token keeps its text */
    customRender?: (props: JsonViewerCustomRenderSlotProps) => VNode[];
    /** Replaces the search button; renders the default one through `defaultButton` */
    searchButton?: (props: JsonViewerSearchButtonSlotProps) => VNode[];
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
