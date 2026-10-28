import { type JSX, For, Show, createMemo, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
import { arrayAdd, isExpandedColumn, isFirstFixedRight, isFixedLeft, isFixedRight, isInnerColumnKey, isLastLeftFixed } from '@fibrae/semi-foundation/table/utils';
import callHandler from '../../_base/call-handler';
import mergeStyles from '../../_base/merge-styles';
import { useTableContext } from '../context';
import { TableExpandIcon } from '../custom-expand-icon';
import type { ColumnProps, OnRow } from '../interface';
import TableCell from '../table-cell';

export interface BaseRowProps {
    cellWidths?: number[];
    class?: string;
    columns: ColumnProps[];
    disabled?: boolean;
    expandableRow?: boolean;
    expanded?: boolean;
    expandedRow?: boolean;
    /** Whether the current row is hovered */
    hovered?: boolean;
    index?: number;
    /** A group section row: its button expands the group, even with a separate expand column */
    isSection?: boolean;
    level?: number;
    onHover?: (mouseEnter: boolean, rowKey: BaseRowKeyType) => void;
    onRow?: OnRow<any>;
    onRowClick?: (rowKey: BaseRowKeyType, e: MouseEvent, expand: boolean) => void;
    record?: Record<string, any>;
    /** The expand button of an expandable row; the tree button of the record by default */
    renderExpandIcon?: () => JSX.Element;
    /** Replaces the row classes the table adds */
    replaceClass?: string;
    rowExpandable?: (record: Record<string, any>) => boolean;
    rowKey?: BaseRowKeyType;
    selected?: boolean;
    style?: JSX.CSSProperties;
    /** whether display none */
    displayNone?: boolean;
}

type RowEvent = MouseEvent & { currentTarget: HTMLTableRowElement; target: Element };

export default function BaseRow(props: BaseRowProps) {
    const table = useTableContext('Table.Row');

    // called again when the record, its index or its selected and disabled state change
    const rowProps = createMemo(() => {
        const onRow = props.onRow;
        const record = props.record;
        const index = props.index as number;
        const status = { disabled: Boolean(props.disabled), selected: Boolean(props.selected) };
        return (typeof onRow === 'function' ? untrack(() => onRow(record, index, status)) : undefined) ?? {};
    });

    const restRowProps = createMemo(() => {
        const { class: _class, style: _style, onClick: _onClick, onMouseEnter: _onMouseEnter, onMouseLeave: _onMouseLeave, onDblClick: _onDblClick, onContextMenu: _onContextMenu, ...rest } = rowProps() as Record<string, any>;
        return rest;
    });

    // Keyed by column rather than by object: the column objects are rebuilt whenever the columns change (a resize drag
    // rebuilds them on every move), and a cell keeps its DOM through that
    const cellIds = createMemo(() => {
        const seen = new Map<string, number>();
        return props.columns.map((column, index) => {
            const base = String(column?.key ?? index);
            const count = seen.get(base) ?? 0;
            seen.set(base, count + 1);
            return count ? `${base}#${count}` : base;
        });
    });

    const cellsById = createMemo(() => new Map(cellIds().map((id, index) => [id, { column: props.columns[index], index }])));

    const prefixCls = () => table.view().prefixCls;

    const components = () => table.view().components;

    // the first data column gets the indent and the expand button
    const firstIndex = () =>
        Math.max(
            0,
            props.columns.findIndex((column) => !isInnerColumnKey(column?.key as string))
        );

    const expandable = () => (props.rowExpandable ? props.rowExpandable(props.record ?? {}) : true);

    const virtualized = () => Boolean(table.props.virtualized);

    const virtualizedCells = () => virtualized() && !props.expandedRow && components().body.cell !== 'td';

    const handleMouseEnter = (e: RowEvent) => {
        props.onHover?.(true, props.rowKey as BaseRowKeyType);
        table.props.onRowMouseEnter?.(props.record, e);
        callHandler(rowProps().onMouseEnter, e);
    };

    const handleMouseLeave = (e: RowEvent) => {
        props.onHover?.(false, props.rowKey as BaseRowKeyType);
        table.props.onRowMouseLeave?.(props.record, e);
        callHandler(rowProps().onMouseLeave, e);
    };

    const handleDoubleClick = (e: RowEvent) => {
        table.props.onRowDoubleClick?.(props.record, e);
        callHandler(rowProps().onDblClick, e);
    };

    const handleContextMenu = (e: PointerEvent & { currentTarget: HTMLTableRowElement; target: Element }) => {
        table.props.onRowContextMenu?.(props.record, e);
        callHandler(rowProps().onContextMenu, e);
    };

    const handleClick = (e: RowEvent) => {
        props.onRowClick?.(props.rowKey as BaseRowKeyType, e, Boolean(props.expanded));
        callHandler(rowProps().onClick, e);
        // an expanded or section row is no record, so its key is never selected
        if (!props.disabled && !props.expandedRow && !props.isSection) {
            table.handleRowSelection(props.rowKey as BaseRowKeyType, !props.selected, e);
        }
    };

    const renderCell = (id: string) => {
        let last: { column: ColumnProps; index: number };
        // the last cell stays readable while For removes this one
        const entry = () => (last = cellsById().get(id) ?? last);
        const column = () => entry().column;
        const columnIndex = () => entry().index;
        const isFirst = () => columnIndex() === firstIndex();
        const hasRowExpandIcon = () => Boolean(props.expandableRow) && isFirst();
        const indent = () => {
            if (props.level == null || !isFirst()) {
                return undefined;
            }
            return !props.expandableRow && table.props.hideExpandedColumn && table.hasExpandIcon() ? props.level + 1 : props.level;
        };

        return (
            <Show when={!isExpandedColumn(column()) || expandable()} fallback={<TableCell />}>
                <TableCell
                    column={column()}
                    columnsToEnd={props.columns.length - columnIndex()}
                    component={components().body.cell}
                    firstFixedRight={isFirstFixedRight(props.columns, column())}
                    fixedLeft={isFixedLeft(column()) && arrayAdd(props.cellWidths, 0, columnIndex())}
                    fixedRight={isFixedRight(column()) && arrayAdd(props.cellWidths, columnIndex() + 1)}
                    hovered={props.hovered}
                    indent={indent()}
                    index={props.index}
                    isSection={props.isSection}
                    lastFixedLeft={isLastLeftFixed(props.columns, column())}
                    record={props.record}
                    // with a separate expand column a record's button is there instead
                    showExpandIcon={hasRowExpandIcon() && (Boolean(props.isSection) || (Boolean(table.props.hideExpandedColumn) && table.hasExpandIcon()))}
                    renderExpandIcon={hasRowExpandIcon() ? (props.renderExpandIcon ?? (() => <TableExpandIcon record={props.record ?? {}} isNested />)) : undefined}
                    // a virtualized row of div cells has no column widths of a table layout
                    width={virtualizedCells() ? props.cellWidths?.[columnIndex()] : undefined}
                />
            </Show>
        );
    };

    return (
        <Dynamic
            component={components().body.row}
            // a virtualized body leaves rows out of the DOM, so indexes are explicit, after the header rows
            aria-rowindex={virtualized() && typeof props.index === 'number' ? table.view().headerRowCount + props.index + 1 : undefined}
            role="row"
            {...restRowProps()}
            class={
                props.replaceClass
                    ? clsx(props.replaceClass, rowProps().class)
                    : clsx(
                          props.class,
                          `${prefixCls()}-row`,
                          {
                              [`${prefixCls()}-row-selected`]: Boolean(props.selected),
                              [`${prefixCls()}-row-expanded`]: Boolean(props.expanded),
                              [`${prefixCls()}-row-hovered`]: Boolean(props.hovered),
                              [`${prefixCls()}-row-hidden`]: Boolean(props.displayNone),
                          },
                          rowProps().class
                      )
            }
            style={mergeStyles(props.style, rowProps().style as JSX.CSSProperties | string | undefined)}
            data-row-key={props.rowKey}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onDblClick={handleDoubleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <For each={cellIds()}>{renderCell}</For>
        </Dynamic>
    );
}
