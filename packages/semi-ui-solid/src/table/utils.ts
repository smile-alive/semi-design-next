import { isServer } from 'solid-js/web';
// compat merge accepts an undefined source and deep-merges the component maps, keeping component functions as they are
import { merge } from 'es-toolkit/compat';
import { cloneFormValue } from '@fibrae/semi-foundation/form/utils';
import isMarkup from '../_base/is-markup';
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

/**
 * Merges the components passed in by the user with the default components
 */
export function mergeComponents(components: TableComponents | undefined, virtualized: boolean): MergedTableComponents {
    return merge(
        {},
        {
            table: 'table',
            header: { outer: 'table', wrapper: 'thead', row: 'tr', cell: 'th' },
            body: virtualized ? { outer: 'div', wrapper: 'div', row: 'div', cell: 'div', colgroup: { wrapper: 'div', col: 'div' } } : { outer: 'table', wrapper: 'tbody', row: 'tr', cell: 'td', colgroup: { wrapper: 'colgroup', col: 'col' } },
        },
        components
    );
}

/** Deep clone that keeps functions and DOM nodes (JSX a column or record holds) as they are; the server has no DOM nodes */
export function cloneDeep<T>(value: T) {
    return cloneFormValue(value, (item) => !isServer && item instanceof Node);
}

/** A plain object, such as the `{ children, ...column }` form of a row render result, rather than content */
export function isRenderReturnObject(value: unknown): value is { children?: unknown } {
    return Boolean(value) && !isMarkup(value) && Object.prototype.toString.call(value) === '[object Object]';
}
