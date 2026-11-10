import { isServer } from 'solid-js/web';
import { merge } from 'es-toolkit';
import { cloneFormValue } from '@fibrae/semi-foundation/components/form/utils';
import { getDefaultComponents } from '@fibrae/semi-foundation/components/table/utils';
import { isMarkup } from '../../utils/index';
import type { TableComponent, TableComponents } from './interface';

export interface MergedTableComponents {
    table: TableComponent;
    header: { outer: TableComponent; wrapper: TableComponent; row: TableComponent; cell: TableComponent };
    body: {
        outer: TableComponent;
        wrapper: TableComponent;
        row: TableComponent;
        cell: TableComponent;
        colgroup: { wrapper: TableComponent; col: TableComponent };
    };
}

export function mergeComponents(components: TableComponents | undefined, virtualized: boolean): MergedTableComponents {
    // The framework-agnostic defaults are typed as plain strings; they are intrinsic tag names
    return merge(getDefaultComponents(virtualized), components ?? {}) as MergedTableComponents;
}

/** Deep clone that keeps functions and DOM nodes (JSX a column or record holds) as they are; the server has no DOM nodes */
export function cloneDeep<T>(value: T) {
    return cloneFormValue(value, (item) => !isServer && item instanceof Node);
}

/** A plain object, such as the `{ children, ...column }` form of a row render result, rather than content */
export function isRenderReturnObject(value: unknown): value is { children?: unknown } {
    return Boolean(value) && !isMarkup(value) && Object.prototype.toString.call(value) === '[object Object]';
}
