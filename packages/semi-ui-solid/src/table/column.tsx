import type { JSX } from 'solid-js';
import { createToken } from '../_base/token';
import type { ColumnProps, Data } from './interface';

export const TABLE_COLUMN = 'Table.Column';

/** Nested columns are `Table.Column` children; the column objects in `ColumnProps.children` belong to the `columns` prop */
export type ColumnElementProps<RecordType extends Record<string, any> = Data> = Omit<ColumnProps<RecordType>, 'children'> & { children?: JSX.Element };

/**
 * Declares a column as a child of Table: Table reads its props and never renders it. No context is read here: the
 * token is created in Table's children() memo.
 */
export default function Column<RecordType extends Record<string, any> = Data>(props: ColumnElementProps<RecordType>) {
    return createToken(TABLE_COLUMN, props);
}
