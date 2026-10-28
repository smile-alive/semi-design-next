import React, { type ReactNode, Fragment, memo } from 'react';
import clsx from 'clsx';
import { omit, isEqual, merge } from 'es-toolkit';
// compat get resolves deep dataIndex paths such as 'a.b'
import { get } from 'es-toolkit/compat';
import { cssClasses, numbers } from '@fibrae/semi-foundation/table/constants';
import { isSelectionColumn, isExpandedColumn, getRTLAlign, shouldShowEllipsisTitle, getRTLFlexAlign } from '@fibrae/semi-foundation/table/utils';
import type { BaseProps } from '../_base/base-component';
import type { ColumnProps, ExpandIcon } from './interface';
import { useTableContext } from './table-context';

export interface TableCellProps extends BaseProps {
    record?: Record<string, any>;
    prefixCls?: string;
    index?: number;
    fixedLeft?: boolean | number;
    lastFixedLeft?: boolean;
    fixedRight?: boolean | number;
    firstFixedRight?: boolean;
    /** The columns from this one to the table's end, itself included */
    columnsToEnd?: number;
    indent?: number;
    indentSize?: number;
    column?: ColumnProps;
    /**
     * Does the first column include expandIcon
     * When hideExpandedColumn is true or isSection is true
     * expandIcon is a custom icon or true
     */
    expandIcon?: ExpandIcon;
    renderExpandIcon?: (record: Record<string, any>) => ReactNode;
    hideExpandedColumn?: boolean;
    component?: any;
    isSection?: boolean;
    width?: string | number;
    height?: string | number;
    selected?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    hovered?: boolean;
}

function isInvalidRenderCellText(text: any) {
    return text && !React.isValidElement(text) && Object.prototype.toString.call(text) === '[object Object]';
}

const EMPTY_COLUMN: ColumnProps = {};

function TableCell({
    record,
    index,
    column = EMPTY_COLUMN,
    fixedLeft,
    fixedRight,
    width,
    height,
    indent = 0,
    indentSize = numbers.DEFAULT_INDENT_WIDTH,
    prefixCls = cssClasses.PREFIX,
    expandIcon,
    renderExpandIcon,
    hovered,
    isSection,
    component: BodyCell = 'td',
    lastFixedLeft,
    firstFixedRight,
    columnsToEnd,
}: TableCellProps) {
    const { direction, renderSelection, anyColumnFixed, splitTable } = useTableContext('Table.Cell');

    let tdProps: { style?: Partial<React.CSSProperties>; colSpan?: number; rowSpan?: number } = {};
    let customCellProps: Record<string, any> = {};
    let renderClassName: string | undefined;

    const isRTL = direction === 'rtl';

    // renamed: a `use` prefix reads as a hook to the React Compiler
    const { className, ellipsis, dataIndex, render, useFullRender: fullRender } = column;
    const fixedLeftFlag = fixedLeft || typeof fixedLeft === 'number';
    const fixedRightFlag = fixedRight || typeof fixedRight === 'number';

    if (fixedLeftFlag) {
        tdProps.style = { [isRTL ? 'right' : 'left']: typeof fixedLeft === 'number' ? fixedLeft : 0 };
    } else if (fixedRightFlag) {
        tdProps.style = { [isRTL ? 'left' : 'right']: typeof fixedRight === 'number' ? fixedRight : 0 };
    }

    if (width != null) {
        tdProps.style = { ...tdProps.style, width };
    }

    if (height != null) {
        tdProps.style = { ...tdProps.style, height };
    }

    if (column.onCell) {
        customCellProps = column.onCell(record, index);
        tdProps = { ...tdProps, ...omit(customCellProps, ['style', 'className', 'onClick']) };
        const customCellStyle = customCellProps?.style || {};
        tdProps.style = { ...tdProps.style, ...customCellStyle };
    }

    if (column.align) {
        const textAlign = getRTLAlign(column.align, direction);
        const justifyContent = getRTLFlexAlign(column.align, direction);
        tdProps.style = { ...tdProps.style, textAlign, justifyContent };
    }

    /**
     * We should return undefined if no dataIndex is specified, but in order to
     * be compatible with object-path's behavior, we return the record object instead.
     */
    let text: any;
    let colSpan: number;
    let rowSpan: number;

    if (typeof dataIndex === 'number') {
        text = get(record, dataIndex);
    } else if (!dataIndex || dataIndex.length === 0) {
        text = record;
    } else {
        text = get(record, dataIndex);
    }

    const indentText = indent && indentSize ? <span className={`${prefixCls}-row-indent indent-level-${indent}`} style={{ paddingInlineStart: `${indentSize * indent}px` }} /> : null;
    const realExpandIcon = (typeof renderExpandIcon === 'function' ? renderExpandIcon(record) : expandIcon) as React.ReactNode;

    if (render) {
        const renderOptions = {
            expandIcon: realExpandIcon,
            isHovering: hovered,
        };

        if (fullRender) {
            const realSelection = typeof renderSelection === 'function' ? renderSelection(record) : null;
            Object.assign(renderOptions, {
                selection: realSelection,
                indentText,
            });
        }

        text = render(text, record, index, renderOptions);
        if (isInvalidRenderCellText(text)) {
            // the className joins the cell's own classes rather than replacing them
            const { className: renderedClassName, ...renderedProps } = text.props ?? {};
            renderClassName = renderedClassName;
            tdProps = merge(tdProps, renderedProps);
            colSpan = tdProps.colSpan;
            rowSpan = tdProps.rowSpan;
            text = text.children;
        }
    }

    if (rowSpan === 0 || colSpan === 0) {
        return null;
    }

    let title: string;

    if (shouldShowEllipsisTitle(ellipsis) && typeof text === 'string') {
        title = text;
    }

    if (isInvalidRenderCellText(text)) {
        text = null;
    }

    let inner: ReactNode = fullRender ? text : [<Fragment key="indentText">{indentText}</Fragment>, <Fragment key="expandIcon">{Boolean(expandIcon) && realExpandIcon}</Fragment>, <Fragment key="text">{text}</Fragment>];

    if (isSection) {
        inner = (
            <div className={clsx(`${prefixCls}-section-inner`)} style={{ width: anyColumnFixed ? 'var(--semi-table-section-width)' : undefined }}>
                {inner}
            </div>
        );
    }

    const [isFixedLeft, isFixedLeftLast, isFixedRight, isFixedRightFirst] = isRTL ? [fixedRightFlag, firstFixedRight, fixedLeftFlag, lastFixedLeft] : [fixedLeftFlag, lastFixedLeft, fixedRightFlag, firstFixedRight];

    const columnCls = clsx(className, `${prefixCls}-row-cell`, customCellProps?.className, renderClassName, {
        [`${prefixCls}-cell-fixed-left`]: isFixedLeft,
        [`${prefixCls}-cell-fixed-left-last`]: isFixedLeftLast,
        [`${prefixCls}-cell-fixed-right`]: isFixedRight,
        [`${prefixCls}-cell-fixed-right-first`]: isFixedRightFirst,
        [`${prefixCls}-cell-last`]: columnsToEnd != null && (tdProps.colSpan ?? 1) >= columnsToEnd,
        [`${prefixCls}-row-cell-ellipsis`]: ellipsis,
    });

    return (
        <BodyCell
            className={columnCls}
            // a role="none" table no longer gives colspan and rowspan their table meaning
            aria-colspan={splitTable && tdProps.colSpan > 1 ? tdProps.colSpan : undefined}
            aria-rowspan={splitTable && tdProps.rowSpan > 1 ? tdProps.rowSpan : undefined}
            // a table, not a grid: the cells have no arrow-key navigation; the role also covers the div cells of a
            // virtualized body
            role="cell"
            title={title}
            onClick={customCellProps?.onClick}
            {...tdProps}
        >
            {inner}
        </BodyCell>
    );
}

/**
 * Whether the cell can skip rendering (the inverse of the class component's shouldComponentUpdate)
 * - A cell in the selection or expand column renders when any prop changes, so its checkbox or icon follows the
 *   selected or expanded state
 * - Any other cell ignores those row states and renders only when its own props change; its content is the user's
 * - column.shouldCellUpdate takes over the decision
 */
function arePropsEqual(prevProps: TableCellProps, nextProps: TableCellProps) {
    const { column = EMPTY_COLUMN, expandIcon } = prevProps;
    const { shouldCellUpdate } = column;
    if (typeof shouldCellUpdate === 'function') {
        return !shouldCellUpdate(nextProps, prevProps);
    }
    // The expand button may be in a separate column or in the first data column
    const columnHasExpandIcon = isExpandedColumn(column) || expandIcon;
    if ((isSelectionColumn(column) || columnHasExpandIcon) && !isEqual(nextProps, prevProps)) {
        return false;
    }
    const omitProps: (keyof TableCellProps)[] = ['selected', 'expanded', 'expandIcon', 'disabled'];
    return isEqual(omit(nextProps, omitProps), omit(prevProps, omitProps));
}

export default memo(TableCell, arePropsEqual);
