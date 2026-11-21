import type { ComputedRef } from 'vue';
import { createContext } from '../../base/index';
import type { JsonViewerProps, JsonViewerSearchOptions } from './interface';

export interface JsonViewerView {
    classNames: JsonViewerProps['classNames'];
    styles: JsonViewerProps['styles'];
    showSearchBar: boolean;
    searchOptions: JsonViewerSearchOptions;
    readOnly?: boolean;
    width: number | string;
    limitSearchButtonBounds: boolean;
}

export interface JsonViewerContext {
    view: ComputedRef<JsonViewerView>;
    search: (text: string) => void;
    prevSearch: () => void;
    nextSearch: () => void;
    replace: (text: string) => void;
    replaceAll: (text: string) => void;
    toggleSearchOption: (key: keyof JsonViewerSearchOptions) => void;
    toggleSearchBar: () => void;
}

export const [provideJsonViewerContext, useJsonViewerContext] = createContext<JsonViewerContext>('JsonViewer');
