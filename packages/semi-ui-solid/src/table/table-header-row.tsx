import { type JSX, For, Show, createEffect, createMemo, on, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { strings } from '@fibrae/semi-foundation/table/constants';
import TableFoundation from '@fibrae/semi-foundation/table/foundation';
import { getColumnsByLevel, getHeaderStickyOffset, getNextSortOrder, getRTLAlign, isExpandedColumn, isFirstFixedRight, isFixedLeft, isFixedRight, isLastLeftFixed, isSelectionColumn, shouldShowEllipsisTitle, sliceColumnsByLevel } from '@fibrae/semi-foundation/table/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import callHandler from '../_base/call-handler';
import mergeStyles from '../_base/merge-styles';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';
import ColumnFilter from './column-filter';
import { TableSelection } from './column-selection';
import ColumnSorter from './column-sorter';
import { useTableContext } from './context';
import type { ColumnProps, ColumnTitleProps } from './interface';
import type { HeaderCell } from './table-header';

export interface TableHeaderRowProps {
    row: HeaderCell[];
    index: number;
    /** All columns of the table, which the cells of this row are a level of */
    columns: ColumnProps[];
}

const ARIA_SORT: Record<string, 'ascending' | 'descending'> = {
    [strings.SORT_DIRECTIONS[0]]: 'ascending',
    [strings.SORT_DIRECTIONS[1]]: 'descending',
};

// a function title is called in a tracked scope, as insert() calls function children, and again when what it reads
// changes
function titleNode(title: ColumnProps['title'], parts: ColumnTitleProps): JSX.Element {
    return typeof title === 'function' ? title(parts) : title;
}

/** How the header cell of a column sorts and filters, decided as React Table does */
function useColumnFlags(column: () => ColumnProps) {
    const table = useTableContext('Table.HeaderCell');

    const hasSorter = () => typeof column().sorter === 'function' || column().sorter === true;
    const hasFilter = () => (Array.isArray(column().filters) && (column().filters?.length ?? 0) > 0) || column().filterDropdown != null || typeof column().renderFilterDropdown === 'function';
    const needsTitle = () => Boolean(column().sorter || column().filters || column().onFilter || column().useFullRender || hasFilter());
    const queryState = createMemo(() => TableFoundation.getColumnQueryState(column(), table.state().queries));
    const query = () => queryState().query;
    const clickToSort = () => needsTitle() && hasSorter() && !hasFilter() && !column().useFullRender;
    // the same test as the foundation's controlled sorter
    const showSortTip = () => column().sortOrder == null && column().showSortTip === true;
    const sortOrder = () => queryState().sortOrder;
    const filteredValue = () => queryState().filteredValue;

    return { hasSorter, hasFilter, needsTitle, query, clickToSort, showSortTip, sortOrder, filteredValue };
}

/**
 * The title of a column with sorting, filtering or useFullRender: the sorter and filter beside the title, or a
 * useFullRender title function given them as parts
 */
function ColumnTitle(props: { column: ColumnProps; flags: ReturnType<typeof useColumnFlags> }) {
    const table = useTableContext('Table.HeaderCell');

    const prefixCls = () => table.view().prefixCls;

    const column = () => props.column;

    const flags = () => props.flags;

    const titleFnGetsParts = () => typeof column().title === 'function' && Boolean(column().useFullRender);

    const renderTitleNode = () => {
        const content = createMemo(() => titleNode(column().title, {}));
        const ellipsisTitle = () => {
            const value = content();
            return shouldShowEllipsisTitle(column().ellipsis ?? false) && typeof value === 'string' ? value : undefined;
        };
        return (
            <span class={`${prefixCls()}-row-head-title`} title={ellipsisTitle()}>
                {content()}
            </span>
        );
    };

    const renderSorter = (title?: JSX.Element) => (
        <ColumnSorter
            prefixCls={prefixCls()}
            title={title}
            // without useFullRender the whole title is the sort click target, to enlarge the hit area
            showTooltip={!flags().clickToSort() && flags().showSortTip()}
            sortIcon={column().sortIcon}
            sortOrder={flags().sortOrder()}
            onClick={column().useFullRender || flags().hasFilter() ? () => table.foundation.handleSort(column()) : undefined}
        />
    );

    const renderFilter = () => {
        // a column without dataIndex has no query: its own options configure the menu
        const query = () => flags().query() ?? column();
        return (
            <ColumnFilter
                prefixCls={prefixCls()}
                filteredValue={flags().filteredValue()}
                filterIcon={column().filterIcon}
                filterDropdown={query().filterDropdown}
                filterDropdownProps={query().filterDropdownProps}
                filters={query().filters}
                filterMultiple={query().filterMultiple}
                filterDropdownVisible={query().filterDropdownVisible}
                renderFilterDropdown={query().renderFilterDropdown}
                renderFilterDropdownItem={query().renderFilterDropdownItem}
                filterConfirmMode={query().filterConfirmMode}
                onFilterDropdownVisibleChange={(visible) => table.foundation.toggleShowFilter(column().dataIndex as string, Boolean(visible))}
                onSelect={(data) => table.foundation.handleFilterSelect(column().dataIndex as string, data)}
            />
        );
    };

    const selectionNode = () => <TableSelection inHeader />;

    // the parts are render functions, so one the title function leaves out is never created
    const titleParts: ColumnTitleProps = {
        selection: selectionNode,
        get sorter() {
            return flags().hasSorter() ? () => renderSorter() : undefined;
        },
        get filter() {
            return flags().hasFilter() ? renderFilter : undefined;
        },
    };

    const renderTitleWithParts = () => {
        const content = createMemo(() => titleNode(column().title, titleParts));
        return <>{content()}</>;
    };

    return (
        <Show when={!titleFnGetsParts()} fallback={renderTitleWithParts()}>
            <Show when={flags().hasSorter() || flags().hasFilter()} fallback={renderTitleNode()}>
                <div class={`${prefixCls()}-operate-wrapper`}>
                    {flags().hasSorter() ? renderSorter(renderTitleNode()) : renderTitleNode()}
                    <Show when={flags().hasFilter()}>{renderFilter()}</Show>
                </div>
            </Show>
        </Show>
    );
}

function HeaderCellView(props: { cell: HeaderCell; cellIndex: number; rowIndex: number; slicedColumns: ColumnProps[]; headWidths: number[] }) {
    const table = useTableContext('Table.HeaderCell');
    const locale = useLocale('Table');

    const column = () => props.cell.column;

    const flags = useColumnFlags(column);

    // called again when the column changes
    const custom = createMemo(() => {
        const col = column();
        const onHeaderCell = col.onHeaderCell;
        return { ...(typeof onHeaderCell === 'function' ? untrack(() => onHeaderCell(col, props.cellIndex, props.rowIndex)) : undefined) } as Record<string, any>;
    });

    const prefixCls = () => table.view().prefixCls;

    const plainTitle = createMemo(() => {
        // a composed title renders its own, so this one would be created and never inserted
        if (flags.needsTitle()) {
            return undefined;
        }
        const title = column().title;
        if (isSelectionColumn(column()) && title === undefined) {
            return untrack(() => <TableSelection inHeader />);
        }
        if (isExpandedColumn(column()) && title === undefined) {
            return untrack(() => <span class={`${prefixCls()}-column-expand-title`}>{locale().locale.expandColumn}</span>);
        }
        // the documented title argument is an object even without title parts
        return titleNode(title, {});
    });

    const direction = () => table.view().direction;

    const isRTL = () => direction() === 'rtl';

    // a composed title carries its own title attribute on the title span
    const ellipsisTitle = () => {
        if (flags.needsTitle() || !shouldShowEllipsisTitle(column().ellipsis ?? false)) {
            return undefined;
        }
        const title = plainTitle();
        return typeof title === 'string' ? title : undefined;
    };

    const attrs = createMemo(() => {
        const { class: _class, style: _style, onClick: _onClick, ...rest } = custom();
        // only a header cell component reads `resize`; a plain th would render it as an attribute
        const resize = typeof table.view().components.header.cell === 'string' ? {} : { resize: column().resize };
        return { title: ellipsisTitle(), colSpan: props.cell.colSpan, rowSpan: props.cell.rowSpan, ...resize, ...rest } as Record<string, any>;
    });

    const colSpan = () => attrs().colSpan ?? attrs().colspan;

    const rowSpan = () => attrs().rowSpan ?? attrs().rowspan;

    const clickToSort = () => flags.clickToSort();

    const showSortTip = () => clickToSort() && flags.showSortTip();

    const textAlign = () => {
        const align = column().align;
        return align ? getRTLAlign(align, direction()) : undefined;
    };

    const style = () => {
        const sticky = getHeaderStickyOffset(column(), props.slicedColumns, props.headWidths, isRTL());
        const position: JSX.CSSProperties | undefined = sticky ? { position: 'sticky', [sticky.side]: toCssLength(sticky.offset) } : undefined;
        const align = textAlign() ? { 'text-align': textAlign() } : undefined;
        // headerStyle is the default for every header cell; the column's onHeaderCell style overrides it
        return mergeStyles(table.props.headerStyle, custom().style, align, position);
    };

    const cls = () => {
        const align = textAlign();
        const [fixedLeft, fixedRight, fixedLeftLast, fixedRightFirst] = isRTL()
            ? [isFixedRight(column()), isFixedLeft(column()), isFirstFixedRight(props.slicedColumns, column()), isLastLeftFixed(props.slicedColumns, column())]
            : [isFixedLeft(column()), isFixedRight(column()), isLastLeftFixed(props.slicedColumns, column()), isFirstFixedRight(props.slicedColumns, column())];
        return clsx(`${prefixCls()}-row-head`, column().class, custom().class, {
            [`${prefixCls()}-align-${align}`]: Boolean(align),
            [`${prefixCls()}-cell-fixed-left`]: fixedLeft,
            [`${prefixCls()}-cell-fixed-left-last`]: fixedLeftLast,
            [`${prefixCls()}-cell-fixed-right`]: fixedRight,
            [`${prefixCls()}-cell-fixed-right-first`]: fixedRightFirst,
            [`${prefixCls()}-cell-last`]: Boolean(props.cell.last),
            [`${prefixCls()}-row-head-ellipsis`]: Boolean(column().ellipsis),
            [`${prefixCls()}-row-head-clickSort`]: clickToSort(),
        });
    };

    const handleClick = (e: MouseEvent & { currentTarget: HTMLElement; target: Element }) => {
        callHandler(custom().onClick, e);
        if (clickToSort()) {
            table.foundation.handleSort(column());
        }
    };

    const renderCell = (own: Record<string, unknown> = {}) => (
        <Dynamic
            component={table.view().components.header.cell}
            // a role="none" table no longer gives colspan and rowspan their table meaning
            aria-colspan={table.view().splitTable && colSpan() > 1 ? colSpan() : undefined}
            aria-rowspan={table.view().splitTable && rowSpan() > 1 ? rowSpan() : undefined}
            // set only on the sorted column, as in the APG sortable table
            aria-sort={flags.hasSorter() && typeof flags.sortOrder() === 'string' ? ARIA_SORT[flags.sortOrder() as string] : undefined}
            role="columnheader"
            {...own}
            {...attrs()}
            class={cls()}
            style={style()}
            onClick={handleClick}
        >
            <Show when={flags.needsTitle()} fallback={plainTitle()}>
                <ColumnTitle column={column()} flags={flags} />
            </Show>
        </Dynamic>
    );

    return (
        <Show when={colSpan() !== 0 && rowSpan() !== 0}>
            <Show when={showSortTip()} fallback={renderCell()}>
                <Tooltip content={locale().locale[getNextSortOrder(flags.sortOrder())]}>
                    {(getTriggerProps) =>
                        renderCell(
                            getTriggerProps({
                                // the sorter inside is the Tab stop; the sort Tooltip would add 0 here
                                tabIndex: -1,
                            }) as Record<string, unknown>
                        )
                    }
                </Tooltip>
            </Show>
        </Show>
    );
}

export default function TableHeaderRow(props: TableHeaderRowProps) {
    const table = useTableContext('Table.HeaderRow');

    let rowElement: HTMLElement | undefined;

    const slicedColumns = createMemo(() => sliceColumnsByLevel(props.columns, props.index) as ColumnProps[]);

    // copied: the user may return the same object every time
    const customRowProps = createMemo(() => {
        const onHeaderRow = table.props.onHeaderRow;
        const columns = props.columns;
        const index = props.index;
        return { ...(typeof onHeaderRow === 'function' ? untrack(() => onHeaderRow(columns, index)) : undefined) } as Record<string, any>;
    });

    const restRowProps = createMemo(() => {
        const { class: _class, ...rest } = customRowProps();
        return rest;
    });

    // Cells are rebuilt whenever the columns change (a filter or sort writes them back); keyed by column so a cell
    // keeps its DOM, and an open filter dropdown stays open
    const cellIds = createMemo(() => props.row.map((cell, cellIndex) => String(cell.column.key ?? cell.column.dataIndex ?? cellIndex)));
    const cellsById = createMemo(() => new Map(props.row.map((cell, cellIndex) => [cellIds()[cellIndex], { cell, cellIndex }])));

    const headWidths = () => table.getCellWidths(slicedColumns());

    const renderCell = (id: string) => {
        let last: { cell: HeaderCell; cellIndex: number };
        // the last cell stays readable while For removes this one
        const entry = () => (last = cellsById().get(id) ?? last);
        return <HeaderCellView cell={entry().cell} cellIndex={entry().cellIndex} headWidths={headWidths()} rowIndex={props.index} slicedColumns={slicedColumns()} />;
    };

    // The measured widths give the sticky offsets of fixed columns. Measured when the columns change, not on every
    // update, since reading layout after a DOM update forces a reflow; the cells of this row are the columns at its level
    createEffect(
        on([() => props.columns, () => table.state().bodyHasScrollBar], () => {
            if (!rowElement) {
                return;
            }
            const levelColumns = getColumnsByLevel(props.columns, props.index) as ColumnProps[];
            const heads = rowElement.querySelectorAll(`.${table.view().prefixCls}-row-head`);
            table.setHeadWidths(
                Array.from(heads, (head, headIndex) => {
                    const configWidth = levelColumns[headIndex]?.width;
                    const width = typeof configWidth === 'number' ? configWidth : head.getBoundingClientRect().width || 0;
                    return { width, key: levelColumns[headIndex]?.key as string };
                }),
                props.index
            );
        })
    );

    return (
        <Dynamic component={table.view().components.header.row} role="row" {...restRowProps()} ref={(node: HTMLElement) => (rowElement = node)} class={clsx(customRowProps().class, `${table.view().prefixCls}-row`)}>
            <For each={cellIds()}>{renderCell}</For>
        </Dynamic>
    );
}
