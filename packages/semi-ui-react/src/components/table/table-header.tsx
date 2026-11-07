import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/table/constants';
import { parseHeaderRows } from '@fibrae/semi-foundation/components/table/utils';
import type { BaseProps } from '../../base/base-component';
import type { TableComponents, OnHeaderRow } from './interface';
import { useTableContext } from './table-context';
import TableHeaderRow from './table-header-row';

export interface TableHeaderProps extends BaseProps {
    columns?: any[];
    components?: TableComponents;
    onHeaderRow?: OnHeaderRow<any>;
    prefixCls?: string;
    bodyHasScrollBar?: boolean;
    /** Rendered only to measure the column widths of fixed columns: no height, and inert */
    hidden?: boolean;
    /** Attached to the thead element */
    ref?: React.Ref<HTMLElement>;
}

const DEFAULT_COMPONENTS: TableComponents = {
    header: {
        wrapper: 'thead',
        row: 'tr',
        cell: 'th',
    },
};
const EMPTY_COLUMNS: any[] = [];

export default function TableHeader({ ref, components = DEFAULT_COMPONENTS, columns = EMPTY_COLUMNS, prefixCls = cssClasses.PREFIX, onHeaderRow, bodyHasScrollBar, hidden }: TableHeaderProps) {
    const { splitTable } = useTableContext('Table.Header');

    const rows = parseHeaderRows(columns);
    const HeaderWrapper = components.header.wrapper;

    return (
        // under a role="none" table a thead would be presentational too
        <HeaderWrapper ref={ref} className={clsx(`${prefixCls}-thead`, { [`${prefixCls}-thead-hidden`]: hidden })} inert={hidden || undefined} role={splitTable ? 'rowgroup' : undefined}>
            {rows.map((row, idx) => (
                <TableHeaderRow key={idx} bodyHasScrollBar={bodyHasScrollBar} columns={columns} components={components} index={idx} prefixCls={prefixCls} row={row} onHeaderRow={onHeaderRow} />
            ))}
        </HeaderWrapper>
    );
}
