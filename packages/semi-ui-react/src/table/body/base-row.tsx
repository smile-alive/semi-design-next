import React, { type ReactNode, memo, useCallback } from 'react';
import clsx from 'clsx';
import { omit, isEqual, pick } from 'es-toolkit';
// compat get falls back to the default only for undefined
import { get } from 'es-toolkit/compat';
import { strings, cssClasses } from '@fibrae/semi-foundation/table/constants';
import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
import { isLastLeftFixed, arrayAdd, isFixedLeft, isFixedRight, isFirstFixedRight, isInnerColumnKey, isExpandedColumn } from '@fibrae/semi-foundation/table/utils';
import { noop } from '@fibrae/semi-foundation/utils/function';
import shallowEqualObjects from '@fibrae/semi-foundation/utils/shallow-equal-objects';
import type { ColumnProps, TableComponents, Virtualized, ExpandIcon, OnRow, RowExpandable } from '../interface';
import TableCell from '../table-cell';
import { useTableContext } from '../table-context';

export interface BaseRowProps {
    cellWidths?: number[];
    className?: string;
    columns: ColumnProps[];
    components?: TableComponents;
    disabled?: boolean;
    expandIcon?: ExpandIcon;
    expandableRow?: boolean;
    expanded?: boolean;
    expandedRow?: boolean;
    hideExpandedColumn?: boolean;
    /** Whether the current row is hovered */
    hovered?: boolean;
    indentSize?: number;
    index?: number;
    isSection?: boolean;
    level?: number;
    onHover?: (mouseEnter: boolean, rowKey: string | number) => void;
    onRow?: OnRow<any>;
    onRowClick?: (rowKey: BaseRowKeyType, e: React.MouseEvent, expand: boolean) => void;
    onRowContextMenu?: (record: Record<string, any>, e: React.MouseEvent) => void;
    onRowDoubleClick?: (record: Record<string, any>, e: React.MouseEvent) => void;
    onRowMouseEnter?: (record: Record<string, any>, e: React.MouseEvent) => void;
    onRowMouseLeave?: (record: Record<string, any>, e: React.MouseEvent) => void;
    prefixCls?: string;
    record?: Record<string, any>;
    renderExpandIcon?: RenderExpandIcon;
    replaceClassName?: string;
    rowExpandable?: RowExpandable<any>;
    rowKey?: string | number;
    selected?: boolean;
    style?: React.CSSProperties;
    virtualized?: Virtualized;
    /** whether display none */
    displayNone?: boolean;
}

/**
 * Props that Body forwards to BaseRow; everything else in Body's render props is dropped.
 */
export const baseRowPropKeys = [
    'cellWidths',
    'className',
    'columns',
    'components',
    'disabled',
    'expandIcon',
    'expandableRow',
    'expanded',
    'displayNone',
    'expandedRow',
    'hideExpandedColumn',
    'hovered',
    'indentSize',
    'index',
    'isSection',
    'level',
    'onHover',
    'onRow',
    'onRowClick',
    'onRowContextMenu',
    'onRowDoubleClick',
    'onRowMouseEnter',
    'onRowMouseLeave',
    'prefixCls',
    'record',
    'renderExpandIcon',
    'replaceClassName',
    'rowExpandable',
    'rowKey',
    'selected',
    'style',
    'virtualized',
];

const EMPTY_COLUMNS: ColumnProps[] = [];
const DEFAULT_COMPONENTS: TableComponents = {
    body: {
        row: 'tr',
        cell: 'td',
    },
};
function alwaysExpandable() {
    return true;
}

function TableRow({
    style,
    components = DEFAULT_COMPONENTS,
    prefixCls = cssClasses.PREFIX,
    selected = false,
    disabled = false,
    onRow,
    index,
    className,
    replaceClassName,
    record,
    hovered = false,
    expanded,
    displayNone,
    expandableRow,
    level,
    expandedRow,
    isSection,
    rowKey,
    columns = EMPTY_COLUMNS,
    expandIcon,
    rowExpandable = alwaysExpandable,
    virtualized,
    indentSize,
    hideExpandedColumn,
    cellWidths,
    renderExpandIcon,
    onRowClick = noop,
    onRowMouseEnter = noop,
    onRowMouseLeave = noop,
    onRowDoubleClick = noop,
    onRowContextMenu = noop,
    onHover = noop,
}: BaseRowProps) {
    const { handleRowSelection, headerRowCount = 0 } = useTableContext('Table.Row');

    // the first data column gets the indent and the expand button; the built-in columns may sit anywhere
    const firstIndex = Math.max(
        0,
        columns.findIndex((column) => !isInnerColumnKey(column?.key))
    );

    const BodyRow = components.body.row;
    const BodyCell = get(components, 'body.cell', strings.DEFAULT_COMPONENTS.body.cell);
    const { className: customClassName, style: customStyle, ...rowProps } = onRow?.(record, index, { disabled, selected }) || {};
    const cells: ReactNode[] = [];
    const displayExpandedColumn = rowExpandable(record);

    const renderTreeExpandIcon = useCallback((rowRecord: Record<string, any>) => renderExpandIcon(rowRecord, true), [renderExpandIcon]);

    for (const [columnIndex, column] of columns.entries()) {
        const expandableProps: {
            renderExpandIcon?: (record: Record<string, any>) => ReactNode;
            expandIcon?: ExpandIcon;
            indent?: number;
        } = {};

        if (expandableRow && columnIndex === firstIndex) {
            expandableProps.renderExpandIcon = renderTreeExpandIcon;
            if (hideExpandedColumn || isSection) {
                expandableProps.expandIcon = expandIcon != null ? expandIcon : true;
            }
        }

        if (level != null && columnIndex === firstIndex) {
            expandableProps.indent = level;
            if (!expandableRow && hideExpandedColumn && expandIcon !== false) {
                expandableProps.indent = level + 1;
            }
        }

        if (isExpandedColumn(column) && !displayExpandedColumn) {
            cells.push(<TableCell key={columnIndex} isSection={isSection} />);
        } else {
            const diyProps: { width?: number } = {};

            if (BodyCell !== strings.DEFAULT_COMPONENTS.body.cell && virtualized && !expandedRow) {
                diyProps.width = cellWidths?.[columnIndex];
            }

            cells.push(
                <TableCell
                    {...expandableProps}
                    {...diyProps}
                    key={columnIndex}
                    component={BodyCell}
                    disabled={disabled}
                    column={column}
                    columnsToEnd={columns.length - columnIndex}
                    expanded={expanded}
                    firstFixedRight={isFirstFixedRight(columns, column)}
                    fixedLeft={isFixedLeft(column) && arrayAdd(cellWidths, 0, columnIndex)}
                    fixedRight={isFixedRight(column) && arrayAdd(cellWidths, columnIndex + 1)}
                    hideExpandedColumn={hideExpandedColumn}
                    hovered={hovered}
                    indentSize={indentSize}
                    index={index}
                    isSection={isSection}
                    lastFixedLeft={isLastLeftFixed(columns, column)}
                    prefixCls={`${prefixCls}`}
                    record={record}
                    selected={selected}
                />
            );
        }
    }

    const rowCls =
        typeof replaceClassName === 'string' && replaceClassName.length
            ? clsx(replaceClassName, customClassName)
            : clsx(
                  className,
                  `${prefixCls}-row`,
                  {
                      [`${prefixCls}-row-selected`]: selected,
                      [`${prefixCls}-row-expanded`]: expanded,
                      [`${prefixCls}-row-hovered`]: hovered,
                      [`${prefixCls}-row-hidden`]: displayNone,
                  },
                  customClassName
              );

    const handleMouseEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
        onHover(true, rowKey);
        onRowMouseEnter(record, e);
        if (typeof rowProps?.onMouseEnter === 'function') {
            rowProps.onMouseEnter(e);
        }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLTableRowElement>) => {
        onHover(false, rowKey);
        onRowMouseLeave(record, e);
        if (typeof rowProps?.onMouseLeave === 'function') {
            rowProps.onMouseLeave(e);
        }
    };

    const handleDoubleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        onRowDoubleClick(record, e);
        if (typeof rowProps?.onDoubleClick === 'function') {
            rowProps.onDoubleClick(e);
        }
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
        onRowContextMenu(record, e);
        if (typeof rowProps?.onContextMenu === 'function') {
            rowProps.onContextMenu(e);
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        onRowClick(rowKey, e, expanded);
        if (typeof rowProps?.onClick === 'function') {
            rowProps.onClick(e);
        }
        // an expanded or section row is no record, so its key is never selected
        if (typeof handleRowSelection === 'function' && !disabled && !expandedRow && !isSection) {
            handleRowSelection(rowKey, !selected, e);
        }
    };

    return (
        <BodyRow
            // a virtualized body leaves rows out of the DOM, so indexes are explicit, after the header rows
            aria-rowindex={virtualized && typeof index === 'number' ? headerRowCount + index + 1 : undefined}
            role="row"
            {...rowProps}
            className={rowCls}
            style={{ ...style, ...customStyle }}
            data-row-key={rowKey}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {cells}
        </BodyRow>
    );
}

/**
 * Shallow comparison of the props, like PureComponent, except a deep comparison of cellWidths
 */
function arePropsEqual(prevProps: BaseRowProps, nextProps: BaseRowProps) {
    const omitProps: (keyof BaseRowProps)[] = ['cellWidths'];
    return shallowEqualObjects(omit(nextProps, omitProps), omit(prevProps, omitProps)) && isEqual(pick(nextProps, omitProps), pick(prevProps, omitProps));
}

export default memo(TableRow, arePropsEqual);

export type RenderExpandIcon = (record: Record<string, any>, isNested: boolean) => ReactNode | null;
