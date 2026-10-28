import { type ReactNode, memo, isValidElement } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/table/constants';
import { arrayAdd } from '@fibrae/semi-foundation/table/utils';
import type { ColumnProps, TableComponents, Virtualized, Fixed } from '../interface';
import { useTableContext } from '../table-context';
import TableRow from './base-row';

export interface TableExpandedRowProps {
    cellWidths: number[];
    className?: string;
    columns?: ColumnProps[];
    components?: TableComponents;
    expanded?: boolean;
    expandedRowRender?: (record?: Record<string, any>, index?: number, expanded?: boolean) => ExpandedRowRenderReturnType;
    indentSize?: number;
    index?: number;
    prefixCls?: string;
    record?: Record<string, any>;
    renderExpandIcon?: (record?: Record<string, any>, isNested?: boolean) => ReactNode | null;
    style?: React.CSSProperties;
    virtualized?: Virtualized;
    displayNone?: boolean;
    rowKey?: string | number;
}

const EMPTY_RECORD: Record<string, any> = {};

function TableExpandedRow({ record = EMPTY_RECORD, columns: propColumns = [], prefixCls = cssClasses.PREFIX, className, expanded, expandedRowRender, renderExpandIcon, index, components, style, virtualized, indentSize, cellWidths, displayNone, rowKey }: TableExpandedRowProps) {
    const { anyColumnFixed, getCellWidths } = useTableContext('Table.ExpandedRow');

    let children: ReactNode = null;
    let column = {};

    const cell: ExpandedRowRenderReturnType = expandedRowRender(record, index, expanded);
    const cellProps: { colSpan?: number; style?: Record<string, any> } = {};

    if (cell === null) {
        return null;
    } else if (!isValidElement(cell) && Object.prototype.toString.call(cell) === '[object Object]') {
        const { children: cellChildren, fixed, ...restProps } = cell as { children: ReactNode; fixed: Fixed };
        children = cellChildren;
        column = { ...restProps };
    } else {
        children = cell as ReactNode;
    }

    if (components?.body?.cell !== strings.DEFAULT_COMPONENTS.body.cell) {
        cellProps.style = {
            ...(virtualized && { height: '100%' }),
            display: 'block',
            width: arrayAdd(cellWidths, 0, propColumns.length),
        };
    } else {
        cellProps.colSpan = propColumns.length;
    }

    const columns = [
        {
            render: () => ({
                props: cellProps,
                children: (
                    <div
                        className={clsx(`${prefixCls}-expand-inner`)}
                        style={{
                            width: anyColumnFixed ? 'var(--semi-table-section-width)' : undefined,
                        }}
                    >
                        {children}
                    </div>
                ),
            }),
            ...column,
        },
    ];

    return (
        <TableRow
            className={clsx(className, `${prefixCls}-row-expand`)}
            style={style}
            cellWidths={getCellWidths(columns)}
            columns={columns}
            components={components}
            displayNone={displayNone}
            expandedRow
            indentSize={indentSize}
            index={index}
            rowKey={`${rowKey}-expanded-row`}
            virtualized={virtualized}
            renderExpandIcon={renderExpandIcon}
        />
    );
}

export default memo(TableExpandedRow);

export type ExpandedRowRenderReturnType = React.ReactNode | ({ children: ReactNode; fixed: Fixed } & Omit<ColumnProps, 'children'>);
