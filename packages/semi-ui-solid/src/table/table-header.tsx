import { Index, createMemo } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { parseHeaderRows, type TableHeaderCell } from '@fibrae/semi-foundation/components/table/utils';
import { useTableContext } from './context';
import type { ColumnProps } from './interface';
import TableHeaderRow from './table-header-row';

export interface TableHeaderProps {
    columns: ColumnProps[];
    hidden?: boolean;
    ref?: (element: HTMLElement) => void;
}

export type HeaderCell = Omit<TableHeaderCell<ColumnProps>, 'column' | 'children' | 'className' | 'parents'> & { column: ColumnProps };

interface MirrorColumn {
    key?: string | number;
    colSpan?: number;
    children?: MirrorColumn[];
    source: ColumnProps;
}

// parseHeaderRows calls a function title to read it; the mirror leaves the title to the cell, which renders it lazily
const mirror = (columns: ColumnProps[]): MirrorColumn[] =>
    columns.map((column) => ({
        key: column.key,
        ...('colSpan' in column ? { colSpan: column.colSpan } : {}),
        ...(Array.isArray(column.children) && column.children.length ? { children: mirror(column.children) } : {}),
        source: column,
    }));

export default function TableHeader(props: TableHeaderProps) {
    const table = useTableContext('Table.Header');

    const rows = createMemo(() => parseHeaderRows(mirror(props.columns)).map((row) => row.map(({ column, children: _children, className: _className, parents: _parents, ...cell }): HeaderCell => ({ ...cell, column: column.source }))));

    return (
        // under a role="none" table a thead would be presentational too
        <Dynamic
            component={table.view().components.header.wrapper}
            ref={(element: HTMLElement) => props.ref?.(element)}
            class={clsx(`${table.view().prefixCls}-thead`, { [`${table.view().prefixCls}-thead-hidden`]: props.hidden })}
            inert={props.hidden || undefined}
            role={table.view().splitTable ? 'rowgroup' : undefined}
        >
            {/* by position: the row arrays are rebuilt whenever the columns change */}
            <Index each={rows()}>{(row, index) => <TableHeaderRow columns={props.columns} index={index} row={row()} />}</Index>
        </Dynamic>
    );
}
