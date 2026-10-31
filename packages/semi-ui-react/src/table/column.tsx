import type { ReactNode } from 'react';
import type { ColumnProps, Data } from './interface';

/** Nested JSX columns are Column elements; the column objects in `ColumnProps.children` belong to the `columns` prop */
type ColumnElementProps<RecordType extends Record<string, any>> = {
    [K in keyof ColumnProps<RecordType>]: K extends 'children' ? ReactNode : ColumnProps<RecordType>[K];
};

function Column<RecordType extends Record<string, any> = Data>(_props: ColumnElementProps<RecordType>): null {
    return null;
}

export default Object.assign(Column, { elementType: 'Table.Column' });
