import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/table/constants';
import { getHeaderStickyOffset, isFirstFixedRight, isLastLeftFixed, isFixedLeft, isFixedRight, sliceColumnsByLevel, getColumnsByLevel, getRTLAlign, getNextSortOrder, type TableHeaderCell } from '@fibrae/semi-foundation/table/utils';
import LocaleConsumer from '../locale/locale-consumer';
import Tooltip from '../tooltip';
import type { TableComponents, OnHeaderRow, TableLocale, ColumnProps } from './interface';
import { useTableContext } from './table-context';

/** A column as Table hands it to the header; not part of the public column configuration */
export interface HeaderColumn extends ColumnProps {
    /** Added by Table to a sortable column without a filter, so that a click on the whole header cell sorts */
    clickToSort?: (e?: React.MouseEvent<HTMLElement>) => void;
}

export interface TableHeaderRowProps {
    components?: TableComponents;
    row?: TableHeaderCell<HeaderColumn>[];
    prefixCls?: string;
    onHeaderRow?: OnHeaderRow<any>;
    index?: number;
    style?: React.CSSProperties;
    columns?: any[];
    /** Whether the body shows a vertical scrollbar; the header narrows with it, so its cells are measured again */
    bodyHasScrollBar?: boolean;
}

const EMPTY_COLUMNS: any[] = [];

const ARIA_SORT: Record<string, 'ascending' | 'descending'> = {
    [strings.SORT_DIRECTIONS[0]]: 'ascending',
    [strings.SORT_DIRECTIONS[1]]: 'descending',
};

export default function TableHeaderRow({ components, row, prefixCls = cssClasses.PREFIX, onHeaderRow, index, style, columns = EMPTY_COLUMNS, bodyHasScrollBar }: TableHeaderRowProps) {
    const { getCellWidths, direction, headerStyle, setHeadWidths, splitTable } = useTableContext('Table.HeaderRow');

    const rowRef = useRef<HTMLElement>(null);

    const isRTL = direction === 'rtl';
    const slicedColumns = sliceColumnsByLevel(columns, index);
    const headWidths = getCellWidths(slicedColumns);
    const HeaderRow = components?.header?.row ?? 'tr';
    const HeaderCell = components?.header?.cell ?? 'th';

    // copied: the user may return the same object on every render
    const customRowProps = onHeaderRow?.(columns, index) || {};
    const rowProps = { ...customRowProps, className: clsx(customRowProps.className, `${prefixCls}-row`) };

    const cells = (row ?? []).map(({ column, ...cellProps }, cellIndex) => {
        const customProps = {
            ...(typeof column.onHeaderCell === 'function' ? column.onHeaderCell(column, cellIndex, index) : {}),
        };
        // Merge order:
        // - headerStyle provides a global default for header cells
        // - column.onHeaderCell().style can override it for a specific column
        let cellStyle = { ...headerStyle, ...customProps.style };
        if (column.align) {
            const textAlign = getRTLAlign(column.align, direction);
            cellStyle = { ...cellStyle, textAlign };
            customProps.className = clsx(customProps.className, {
                [`${prefixCls}-align-${textAlign}`]: Boolean(textAlign),
            });
        }

        const [fixedLeft, fixedRight, fixedLeftLast, fixedRightFirst] = isRTL
            ? [isFixedRight(column), isFixedLeft(column), isFirstFixedRight(slicedColumns, column), isLastLeftFixed(slicedColumns, column)]
            : [isFixedLeft(column), isFixedRight(column), isLastLeftFixed(slicedColumns, column), isFirstFixedRight(slicedColumns, column)];

        customProps.className = clsx(`${prefixCls}-row-head`, column.className, customProps.className, {
            [`${prefixCls}-cell-fixed-left`]: fixedLeft,
            [`${prefixCls}-cell-fixed-left-last`]: fixedLeftLast,
            [`${prefixCls}-cell-fixed-right`]: fixedRight,
            [`${prefixCls}-cell-fixed-right-first`]: fixedRightFirst,
            [`${prefixCls}-cell-last`]: cellProps.last,
            [`${prefixCls}-row-head-ellipsis`]: column.ellipsis,
            [`${prefixCls}-row-head-clickSort`]: column.clickToSort,
        });

        const sticky = getHeaderStickyOffset(column, slicedColumns, headWidths, isRTL);
        if (sticky) {
            cellStyle = { ...cellStyle, position: 'sticky', [sticky.side]: sticky.offset };
        }

        // only a header cell component reads `resize`; on a plain th (the table shown while ResizableTable loads) it
        // would land on the DOM
        const resizeProp = typeof HeaderCell === 'string' ? {} : { resize: column.resize };
        const cellAttrs: Record<string, any> = omit({ ...cellProps, ...resizeProp, ...customProps }, ['colStart', 'colEnd', 'last', 'hasSubColumns', 'parents', 'level']);

        const { rowSpan, colSpan } = cellAttrs;
        if (rowSpan === 0 || colSpan === 0) {
            return null;
        }

        if (typeof column.clickToSort === 'function') {
            const { onClick } = cellAttrs;
            cellAttrs.onClick = onClick
                ? (e: React.MouseEvent<HTMLElement>) => {
                      onClick(e);
                      column.clickToSort(e);
                  }
                : column.clickToSort;
        }

        const showSortTip = typeof column.clickToSort === 'function' && column.showSortTip === true;
        const headerCellNode = (
            <HeaderCell
                // a role="none" table no longer gives colspan and rowspan their table meaning
                aria-colspan={splitTable && colSpan > 1 ? colSpan : undefined}
                aria-rowspan={splitTable && rowSpan > 1 ? rowSpan : undefined}
                // set only on the sorted column, as in the APG sortable table
                aria-sort={column.sorter && typeof column.sortOrder === 'string' ? ARIA_SORT[column.sortOrder] : undefined}
                role="columnheader"
                // the sorter inside is the Tab stop; the sort Tooltip would add 0 here
                tabIndex={showSortTip ? -1 : undefined}
                {...cellAttrs}
                key={column.key ?? column.dataIndex ?? cellIndex}
                style={cellStyle}
            />
        );
        if (showSortTip) {
            const content = getNextSortOrder(column.sortOrder);
            return (
                <LocaleConsumer key={column.key ?? column.dataIndex ?? cellIndex} componentName="Table">
                    {(locale: TableLocale) => <Tooltip content={locale[content]}>{headerCellNode}</Tooltip>}
                </LocaleConsumer>
            );
        }

        return headerCellNode;
    });

    // The measured widths give the sticky offsets of fixed columns. Measured when the columns change, not on every
    // render, since reading layout after a DOM update forces a reflow; the cells of this row are the columns at its level
    useLayoutEffect(() => {
        const node = rowRef.current;
        if (node && setHeadWidths) {
            const levelColumns = getColumnsByLevel(columns, index);
            const heads = node.querySelectorAll?.(`.${prefixCls}-row-head`);
            setHeadWidths(
                Array.from(heads ?? [], (head, headIndex) => {
                    let configWidth = levelColumns[headIndex]?.width;
                    const key = levelColumns[headIndex]?.key;
                    if (typeof configWidth !== 'number') {
                        configWidth = (head && head.getBoundingClientRect().width) || 0;
                    }
                    return { width: configWidth, key };
                }),
                index
            );
        }
    }, [columns, bodyHasScrollBar, setHeadWidths, prefixCls, index]);

    return (
        <HeaderRow role="row" {...rowProps} ref={rowRef} style={style}>
            {cells}
        </HeaderRow>
    );
}
