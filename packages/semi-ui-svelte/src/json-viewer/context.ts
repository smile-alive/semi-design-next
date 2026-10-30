import { createContext } from '../_base/create-context.js';
import type { JsonViewerSearchOptions } from './interface.js';

export interface JsonViewerContext {
    readonly showSearchBar: boolean;
    readonly searchOptions: JsonViewerSearchOptions;
    readonly readOnly: boolean;
    readonly width: number | string;
    readonly limitSearchButtonBounds: boolean;
    search: (text: string) => void;
    prevSearch: () => void;
    nextSearch: () => void;
    replace: (text: string) => void;
    replaceAll: (text: string) => void;
    toggleSearchOption: (key: keyof JsonViewerSearchOptions) => void;
    toggleSearchBar: () => void;
}

export const [getJsonViewerContext, setJsonViewerContext] = createContext<JsonViewerContext>('JsonViewer');
