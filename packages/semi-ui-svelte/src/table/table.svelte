<script lang="ts" module>
    const EMPTY_KEYS = new Set<string | number>();
</script>

<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import { SvelteMap, SvelteSet } from 'svelte/reactivity';
    import { cloneDeep, isEqual } from 'es-toolkit';
    import { get } from 'es-toolkit/compat';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/table/constants';
    import TableFoundation, { type BaseColumnProps, type BaseHeadWidth, type TableAdapter } from '@fibrae/semi-foundation/table/foundation';
    import { amendTableWidth, assignColumnKeys, findColumn, flattenColumns, flattenData, getCellWidths, getHeaderRowCount, isMissingDataIndex, mergedRowExpandable, type FlattenData, type GroupFlattenData } from '@fibrae/semi-foundation/table/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/table/table.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import Spin from '../spin/spin.svelte';
    import Body from './body/body.svelte';
    import { setTableContext, type RowEventName, type TableContextValue, type TableFoundationProps, type TableState } from './context.js';
    import HeadTable from './head-table.svelte';
    import type { ColumnProps, TableChangeInfo, TableHandle, TablePaginationProps, TableProps, TableRowKey, TableVirtualizedProps } from './interface.js';
    import TablePagination from './table-pagination.svelte';
    import { addWidthPlaceholders, buildColumns, copyColumns, expandColumn, joinStyles, mergeComponents, mergePagination, selectionColumn } from './utils.js';

    type AnyRecord = Record<string, any>;
    type Foundation = TableFoundation<AnyRecord, TableFoundationProps>;
    type Adapter = TableAdapter<AnyRecord, TableFoundationProps>;

    const defaults = useDefaultProps('Table');

    let {
        bordered = defaults('bordered', false),
        childrenRecordName = defaults('childrenRecordName', 'children'),
        clickGroupedRowToExpand = defaults('clickGroupedRowToExpand', false),
        columns = defaults('columns'),
        components = defaults('components'),
        currentPage = $bindable(),
        dataSource = defaults('dataSource'),
        defaultExpandAllGroupRows = defaults('defaultExpandAllGroupRows', false),
        defaultExpandAllRows = defaults('defaultExpandAllRows', false),
        direction = defaults('direction'),
        expandAllGroupRows = defaults('expandAllGroupRows', false),
        expandAllRows = defaults('expandAllRows', false),
        expandCellFixed = defaults('expandCellFixed', false),
        expandIcon = defaults('expandIcon'),
        expandedRowKeys = $bindable(),
        expandRowByClick = defaults('expandRowByClick', false),
        footer = defaults('footer'),
        groupBy = defaults('groupBy'),
        groupSectionColumn = defaults('groupSectionColumn'),
        headerStyle = defaults('headerStyle'),
        hideExpandedColumn = defaults('hideExpandedColumn', true),
        indentSize = defaults('indentSize', 20),
        keepDOM = defaults('keepDOM', false),
        loading = defaults('loading', false),
        pagination = defaults('pagination', true),
        prefixCls = defaults('prefixCls', cssClasses.PREFIX),
        resizable = defaults('resizable', false),
        rowExpandable = defaults('rowExpandable'),
        rowKey = defaults('rowKey', 'key'),
        rowSelection = defaults('rowSelection'),
        rowSpanHover = defaults('rowSpanHover', false),
        scroll = defaults('scroll'),
        selectedRowKeys = $bindable(),
        showHeader = defaults('showHeader', true),
        size = defaults('size', 'default'),
        sticky = defaults('sticky'),
        title = defaults('title'),
        virtualized = defaults('virtualized'),
        onChange,
        onExpand,
        onExpandedRowsChange,
        onGroupedRow = defaults('onGroupedRow'),
        onHeaderRow = defaults('onHeaderRow'),
        onRow = defaults('onRow'),
        onRowMouseEnter,
        onRowMouseLeave,
        onRowDoubleClick,
        onRowContextMenu,
        onScroll,
        cell,
        headerCell,
        empty,
        expandedRow,
        groupSection,
        sortIcon,
        filterIcon,
        filterDropdown,
        filterDropdownItem,
        selectionCell,
        paginationContent,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
        ...rest
    }: TableProps = $props();

    const config = getConfigContext();
    const locale = useLocale('Table');

    const titleId = $props.id();
    let root = $state<HTMLDivElement>();
    let wrap = $state<HTMLDivElement>();
    let head = $state<HTMLDivElement>();
    let body = $state<ReturnType<typeof Body>>();
    let lastScrollLeft: number | undefined;
    let lastData: AnyRecord[] = [];
    let committed: { props: TableFoundationProps; flatten?: BaseColumnProps<AnyRecord>[] } | null = null;
    let widthFrame = 0;

    // the page the user just chose; a bound page that differs from it came from the parent, which gets no onChange back
    let userPage: number | undefined;
    let followingParent = false;

    /*
     * What dragging a resizable header changed, by column key: the width and the fields the resize callbacks return.
     * Only these outlive a change of the columns prop; a column never dragged follows the prop.
     */
    const overrides = new SvelteMap<string | number, Partial<ColumnProps>>();

    // the columns being dragged get the handler class, which is not kept once the drag ends
    const resizing = new SvelteSet<string | number>();

    /*
     * The foundation compares dataSource by reference: rows added or removed in place (push, splice on a $state array)
     * give it a new reference, while a new array of the same records keeps the old one.
     * shortcut: a record field changed in place re-renders its cell but does not sort or filter again; upgrade with an
     * explicit refresh once sorting or filtering on mutable fields is needed.
     */
    const data = $derived.by(() => {
        const list = dataSource ?? [];
        const next = [...list];
        const same = next.length === lastData.length && next.every((record, index) => record === lastData[index]);
        if (!same) {
            lastData = next;
        }
        return lastData;
    });

    const resizeOptions = $derived(typeof resizable === 'object' ? resizable : {});
    const hasExpandedRow = $derived(Boolean(expandedRow));

    // the bindable top-level values win over the same fields inside the objects, which `bind:` cannot reach
    const mergedSelection = $derived(rowSelection && selectedRowKeys !== undefined ? { ...(rowSelection === true ? {} : rowSelection), selectedRowKeys } : rowSelection);

    /*
     * A pagination.currentPage makes the pager controlled, and the foundation then no longer slices dataSource.
     * So the bound page is also controlled when the object controls it, and otherwise only the starting page of the table's own
     * paging: later changes of the bound value go through foundation.setPage in the watch below.
     */
    const paginationOptions = $derived(typeof pagination === 'object' ? pagination : undefined);
    const pageControlled = $derived(paginationOptions?.currentPage != null);

    const mergedPaging = $derived.by(() => {
        if (!pagination) {
            return pagination;
        }
        const base = pagination === true ? {} : pagination;
        if (pageControlled) {
            return currentPage === undefined ? pagination : { ...base, currentPage };
        }
        const initial = untrack(() => currentPage);
        return initial === undefined ? pagination : { ...base, defaultCurrentPage: initial };
    });

    const innerColumns = $derived([expandColumn(hideExpandedColumn, expandCellFixed, prefixCls), selectionColumn(mergedSelection, prefixCls)]);
    const showExpandIcon = $derived(expandIcon !== false);
    const fixedHeader = $derived(Boolean(scroll?.y) || Boolean(sticky));
    const isVirtualized = $derived(Boolean(virtualized));
    const splitTable = $derived(fixedHeader || isVirtualized);
    const mergedComponents = $derived(mergeComponents(components, isVirtualized));
    const paginationPosition = $derived(paginationOptions?.position ?? 'bottom');
    const formatPageText = $derived(paginationOptions?.formatPageText);
    const hasTitle = $derived(typeof title === 'function' || Boolean(title));
    const hasFooter = $derived(typeof footer === 'function' || Boolean(footer));

    const nameAttrs = $derived({
        'aria-label': ariaLabel,
        'aria-labelledby': hasTitle && ariaLabel == null && ariaLabelledby == null ? titleId : ariaLabelledby,
        'aria-describedby': ariaDescribedby,
    });

    // writes into a fresh copy of the columns
    const applyOverrides = (list: ColumnProps[]): ColumnProps[] => {
        for (const column of list) {
            if (column.key != null) {
                Object.assign(column, overrides.get(column.key));
                if (resizing.has(column.key)) {
                    column.class = [column.class, resizeOptions.handlerClassName ?? 'resizing'].filter(Boolean).join(' ');
                }
            }
            if (Array.isArray(column.children)) {
                applyOverrides(column.children);
            }
        }
        return list;
    };

    // a resizable table finds the dragged column by key, so its columns get keys first; a plain table uses the prop as given
    const cachedColumns = $derived(resizable ? applyOverrides(addWidthPlaceholders(assignColumnKeys(copyColumns(columns ?? [])) as ColumnProps[], hasExpandedRow ? innerColumns[0] : null, innerColumns[1])) : (columns ?? []));
    const flattened = $derived(flattenColumns(cachedColumns) as ColumnProps[]);
    const tableColumns = $derived(buildColumns(cachedColumns, innerColumns));
    const flattenedColumns = $derived(flattenColumns(tableColumns) as ColumnProps[]);
    const anyColumnFixed = $derived(tableColumns.some((column) => Boolean(column.fixed)));

    // a hidden header is inert, so its rows are not rows of the table
    const headerRowCount = $derived(showHeader ? getHeaderRowCount(tableColumns) : 0);
    const tableLayout = $derived<'fixed' | 'auto'>(flattenedColumns.some((column) => Boolean(column.ellipsis) || Boolean(column.fixed)) || fixedHeader ? 'fixed' : 'auto');

    // The wrapper width gives the width of section and expanded rows and the fixed column shadows, through a CSS
    // variable rather than state: a window drag resizes the table every frame
    const needSyncTableWidth = $derived(anyColumnFixed || (showHeader && fixedHeader));

    const expandedRowRender = () => null;

    const foundationProps: TableFoundationProps = {
        get dataSource() {
            return data;
        },
        get rowKey() {
            return rowKey as TableFoundationProps['rowKey'];
        },
        get childrenRecordName() {
            return childrenRecordName;
        },
        get groupBy() {
            return groupBy as TableFoundationProps['groupBy'];
        },
        get pagination() {
            return mergedPaging as TableFoundationProps['pagination'];
        },
        get rowSelection() {
            return mergedSelection as TableFoundationProps['rowSelection'];
        },
        get expandedRowKeys() {
            return expandedRowKeys;
        },
        get defaultExpandAllRows() {
            return defaultExpandAllRows;
        },
        get expandAllRows() {
            return expandAllRows;
        },
        get defaultExpandAllGroupRows() {
            return defaultExpandAllGroupRows;
        },
        get expandAllGroupRows() {
            return expandAllGroupRows;
        },
        // the foundation only tests whether it is a function; the content comes from the expandedRow snippet
        get expandedRowRender() {
            return expandedRow ? expandedRowRender : undefined;
        },
        get rowExpandable() {
            return rowExpandable as TableFoundationProps['rowExpandable'];
        },
        get scroll() {
            return scroll;
        },
    };

    // the Svelte columns carry snippets and wider callbacks than the foundation's column type declares
    const toFoundationColumns = (list: ColumnProps[]) => {
        return list as BaseColumnProps<AnyRecord>[];
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, TableFoundationProps, TableState>(
        TableFoundation,
        foundationProps,
        (view) => {
            const initial = toFoundationColumns(flattened);
            return TableFoundation.getInitialState<AnyRecord>(view, initial, TableFoundation.initColumnsFilteredValueAndSorterOrder<AnyRecord>(cloneDeep(initial)));
        },
        (base) => ({
            resetScrollY: () => {
                const scroller = body?.element();
                if (scroll?.y) {
                    if (scroller) {
                        scroller.scrollTop = 0;
                    }
                } else {
                    wrap?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            },
            getScrollMetrics: () => TableFoundation.readScrollMetrics(body?.element()),
            setScrollableEdges: (edges) => TableFoundation.writeScrollableEdges(body?.element(), edges),
            setSelectedRowKeys: (selectedRowKeys) =>
                base.setState({
                    rowSelection: {
                        ...base.getState('rowSelection'),
                        selectedRowKeys: [...selectedRowKeys],
                        selectedRowKeysSet: new Set(selectedRowKeys),
                    },
                }),
            setPageDisabledRowKeys: (pageDisabledRowKeys) => base.setState({ pageDisabledRowKeys, pageDisabledRowKeysSet: new Set(pageDisabledRowKeys) }),
            setPagination: (next) => base.setState({ pagination: next }),
            setGroups: (groups) => base.setState({ groups }),
            setDataSource: (records) => base.setState({ dataSource: records }),
            setExpandedRowKeys: (keys) => base.setState({ expandedRowKeys: [...keys] }),
            setQueries: (queries) => base.setState({ queries }),
            setAllRowKeys: (allRowKeys) => base.setState({ allRowKeys }),
            setCachedFilteredSortedDataSource: (filteredSortedDataSource) => base.setState({ filteredSortedDataSource }),
            setCachedFilteredSortedRowKeys: (filteredSortedRowKeys) => base.setState({ filteredSortedRowKeys, filteredSortedRowKeysSet: new Set(filteredSortedRowKeys) }),
            setFilteredDisabledRowKeys: (filteredDisabledRowKeys) => base.setState({ filteredDisabledRowKeys, filteredDisabledRowKeysSet: new Set(filteredDisabledRowKeys) }),
            getCurrentPage: () => base.getStates().pagination?.currentPage ?? 1,
            getCachedFilteredSortedDataSource: () => base.getState('filteredSortedDataSource') ?? [],
            getCachedFilteredSortedRowKeys: () => base.getState('filteredSortedRowKeys') ?? [],
            getFilteredDisabledRowKeysSet: () => base.getState('filteredDisabledRowKeysSet') ?? new Set(),
            getHalfCheckedRowKeys: () => base.getState('halfCheckedRowKeys') ?? [],
            setHalfCheckedRowKeys: (halfCheckedRowKeys) => base.setState({ halfCheckedRowKeys, halfCheckedRowKeysSet: new Set(halfCheckedRowKeys) }),
            getKeyEntities: () => base.getState('keyEntities') ?? {},
            setKeyEntities: (keyEntities) => base.setState({ keyEntities }),
            getCheckRelation: () => base.getState('rowSelection')?.checkRelation ?? 'unRelated',
            notifyFilterDropdownVisibleChange: (visible, dataIndex) => {
                const column = dataIndex ? base.getState('queries')?.find((query) => query.dataIndex === dataIndex) : undefined;
                (column as ColumnProps | undefined)?.onFilterDropdownVisibleChange?.(visible);
            },
            notifyChange: (changeInfo) => {
                if (!followingParent) {
                    onChange?.(changeInfo as TableChangeInfo);
                }
            },
            notifyExpand: (expanded, record, mouseEvent) => onExpand?.(expanded, record, mouseEvent),
            notifyExpandedRowsChange: (expandedRows, nextKeys) => {
                // bound, the write reaches the parent; unbound, it overrides locally
                expandedRowKeys = nextKeys;
                onExpandedRowsChange?.(expandedRows);
            },
            notifySelect: (record, selected, selectedRows, event) => rowSelectionFn('onSelect')?.(record, selected, selectedRows, event),
            notifySelectAll: (selected, selectedRows, changedRows, event) => rowSelectionFn('onSelectAll')?.(selected, selectedRows, changedRows, event),
            notifySelectionChange: (keys, selectedRows) => {
                // a write would shadow the controlled field in rowSelection, whose owner is the one to accept or refuse the change
                if (selectedRowKeys !== undefined || !Array.isArray(typeof rowSelection === 'object' ? rowSelection.selectedRowKeys : undefined)) {
                    selectedRowKeys = [...keys];
                }
                rowSelectionFn('onChange')?.(keys, selectedRows);
            },
        })
    );

    // derived during render as React does; the watch below writes it back for the foundation's event handlers
    const view = $derived.by((): TableState => {
        const current = states();
        const changes = TableFoundation.deriveState(foundationProps, current, toFoundationColumns(flattened));
        return changes ? { ...current, ...changes } : current;
    });

    const pageData = $derived(view.dataSource ?? []);

    const mergedPagination = $derived(
        pagination
            ? mergePagination(view.pagination as TablePaginationProps | undefined, Boolean(scroll?.scrollToFirstRowOnChange), foundation.setPage, foundation.resetScrollY, (page) => {
                  // same as the selection: a controlled pagination.currentPage stays with its owner
                  userPage = page;
                  if (currentPage !== undefined || paginationOptions?.currentPage == null) {
                      currentPage = page;
                  }
              })
            : null
    );

    const rowExpandableFn = (record: AnyRecord) => mergedRowExpandable(record, { childrenRecordName, hasExpandedRow, rowExpandable });

    // a virtualized table counts all its rows in aria-rowcount, so the rows are flattened here rather than in the body
    const virtualizedData = $derived<(FlattenData | GroupFlattenData)[]>(
        isVirtualized
            ? flattenData(
                  {
                      rowKey: rowKey as TableRowKey,
                      childrenRecordName,
                      expandedRowRender: hasExpandedRow ? expandedRowRender : undefined,
                      expandedRowKeys: view.expandedRowKeys,
                      groups: view.groups,
                      rowExpandable: rowExpandableFn,
                  },
                  view.dataSource
              )
            : []
    );

    const emitRowEvent = (name: RowEventName, record: AnyRecord, event: MouseEvent) => {
        const handlers = { onRowMouseEnter, onRowMouseLeave, onRowDoubleClick, onRowContextMenu };
        handlers[name]?.(record, event);
    };

    const setHeadWidths = (widths: BaseHeadWidth[], index = 0) => {
        const prev = foundation.getState('headWidths') ?? [];
        if (!isEqual(prev[index], widths)) {
            const next = [...prev];
            next[index] = [...widths];
            foundation.setState({ headWidths: next });
        }
    };

    const setBodyHasScrollbar = (hasScrollbar: boolean) => {
        if (hasScrollbar !== foundation.getState('bodyHasScrollBar')) {
            foundation.setState({ bodyHasScrollBar: hasScrollbar });
        }
    };

    const readCellWidths = (list: ColumnProps[]) => {
        const measured = getCellWidths(view.headWidths, list);
        if (measured.length || !isVirtualized) {
            return measured;
        }
        // Nothing is measured before mount, and a virtualized body renders nothing without widths: the declared numeric
        // widths stand in for the first frame, and the selection and expand columns take their default widths.
        // shortcut: a column without a numeric width leaves the body to render after mount; upgrade if first-frame rows
        // are needed for such columns, which would require a width estimate.
        const declared = list.map((column) => {
            if (column.key === strings.DEFAULT_KEY_COLUMN_SELECTION) {
                return column.width ?? numbers.DEFAULT_WIDTH_COLUMN_SELECTION;
            }
            return column.key === strings.DEFAULT_KEY_COLUMN_EXPAND ? (column.width ?? numbers.DEFAULT_WIDTH_COLUMN_EXPAND) : column.width;
        });
        return declared.every((width) => typeof width === 'number') ? (declared as number[]) : [];
    };

    // synced on the DOM, not state, so a horizontal scroll re-renders nothing
    const handleBodyScroll = (event: Event) => {
        const target = event.target;
        if (event.currentTarget !== target || !(target instanceof HTMLElement)) {
            return;
        }
        const scroller = body?.element();
        if (target.scrollLeft !== lastScrollLeft) {
            if (target === scroller && head) {
                head.scrollLeft = target.scrollLeft;
            } else if (target === head && scroller) {
                scroller.scrollLeft = target.scrollLeft;
            }
        }
        lastScrollLeft = target.scrollLeft;
        foundation.syncScrollEdges();
    };

    // Reads the latest columns, not those of the last render: the moves of a fast drag can arrive before a render
    const resizeColumn = (column: ColumnProps, phase: 'start' | 'move' | 'stop', width?: number) => {
        const key = (
            findColumn(
                untrack(() => cachedColumns),
                column
            ) as ColumnProps | undefined
        )?.key;
        if (key == null) {
            return;
        }
        if (phase === 'start') {
            resizing.add(key);
        } else if (phase === 'stop') {
            resizing.delete(key);
        }
        // read after the resizing mark changes, so the callbacks see the class the header gets
        const current = findColumn(
            untrack(() => cachedColumns),
            column
        ) as ColumnProps;
        let change: Partial<ColumnProps> | void;
        if (phase === 'move') {
            change = { width, ...resizeOptions.onResize?.({ ...current, width }) };
        } else if (phase === 'start') {
            change = resizeOptions.onResizeStart?.(current);
        } else {
            change = resizeOptions.onResizeStop?.(current);
        }
        overrides.set(key, { ...overrides.get(key), ...change });
    };

    const context: TableContextValue = {
        get prefixCls() {
            return prefixCls;
        },
        get direction() {
            return direction ?? config.direction ?? 'ltr';
        },
        get size() {
            return size;
        },
        get anyColumnFixed() {
            return anyColumnFixed;
        },
        get flattenedColumns() {
            return flattenedColumns;
        },
        get headWidths() {
            return view.headWidths ?? [];
        },
        get headerStyle() {
            return headerStyle;
        },
        get rowSpanHover() {
            return rowSpanHover;
        },
        get splitTable() {
            return splitTable;
        },
        get headerRowCount() {
            return headerRowCount;
        },
        get virtualized() {
            return isVirtualized;
        },
        get components() {
            return mergedComponents;
        },
        get tableLayout() {
            return tableLayout;
        },
        get bodyHasScrollbar() {
            return Boolean(view.bodyHasScrollBar);
        },
        get queries() {
            return (view.queries ?? []) as ColumnProps[];
        },
        get scroll() {
            return scroll;
        },
        get sticky() {
            return sticky;
        },
        get showHeader() {
            return showHeader;
        },
        get virtualizedProps() {
            return typeof virtualized === 'object' ? (virtualized as TableVirtualizedProps) : undefined;
        },
        get childrenRecordName() {
            return childrenRecordName;
        },
        get indentSize() {
            return indentSize;
        },
        get hideExpandedColumn() {
            return hideExpandedColumn;
        },
        get showExpandIcon() {
            return showExpandIcon;
        },
        get expandRowByClick() {
            return expandRowByClick;
        },
        get keepDOM() {
            return keepDOM;
        },
        get clickGroupedRowToExpand() {
            return clickGroupedRowToExpand;
        },
        get hasExpandedRow() {
            return hasExpandedRow;
        },
        get resizable() {
            return Boolean(resizable);
        },
        get rowSelection() {
            return view.rowSelection ?? undefined;
        },
        get filteredDisabledRowKeysSet() {
            return view.filteredDisabledRowKeysSet ?? EMPTY_KEYS;
        },
        get halfCheckedRowKeysSet() {
            return view.halfCheckedRowKeysSet ?? EMPTY_KEYS;
        },
        get filteredSortedRowKeys() {
            return view.filteredSortedRowKeys ?? [];
        },
        get filteredSortedRowKeysSet() {
            return view.filteredSortedRowKeysSet ?? EMPTY_KEYS;
        },
        get expandedRowKeys() {
            return view.expandedRowKeys ?? [];
        },
        get rowKey() {
            return rowKey as TableRowKey;
        },
        parts: {
            get cell() {
                return cell;
            },
            get headerCell() {
                return headerCell;
            },
            get expandedRow() {
                return expandedRow;
            },
            get groupSection() {
                return groupSection;
            },
            get sortIcon() {
                return sortIcon;
            },
            get filterIcon() {
                return filterIcon;
            },
            get filterDropdown() {
                return filterDropdown;
            },
            get filterDropdownItem() {
                return filterDropdownItem;
            },
            get selectionCell() {
                return selectionCell;
            },
            get paginationContent() {
                return paginationContent;
            },
            get expandIcon() {
                return typeof expandIcon === 'function' ? expandIcon : undefined;
            },
            get onRow() {
                return onRow;
            },
            get onHeaderRow() {
                return onHeaderRow;
            },
            get onGroupedRow() {
                return onGroupedRow;
            },
            get groupSectionColumn() {
                return groupSectionColumn;
            },
        },
        foundation,
        setHeadWidths,
        getCellWidths: readCellWidths,
        setBodyHasScrollbar,
        handleBodyScroll,
        rowExpandable: rowExpandableFn,
        emitRowEvent,
        resizeColumn,
    };

    setTableContext(context);

    // the state keeps the user's rowSelection, whose callbacks the foundation's rowSelection type does not list
    const rowSelectionFn = (name: 'onSelect' | 'onSelectAll' | 'onChange'): ((...args: unknown[]) => void) | undefined => {
        const fn = get(foundation.getState('rowSelection'), name);
        return typeof fn === 'function' ? fn : undefined;
    };

    const syncTableWidth = () => {
        root?.style.setProperty('--semi-table-section-width', `${amendTableWidth(root.getBoundingClientRect().width)}px`);
    };

    /** The data of the current page, deep cloned */
    const readCurrentPageData = () => {
        const current = foundation.getCurrentPageData();
        const result: ReturnType<TableHandle['getCurrentPageData']> = {};
        if (current.dataSource) {
            result.dataSource = current.dataSource;
        }
        if (current.groups) {
            result.groups = current.groups;
        }
        return cloneDeep(result);
    };

    watch(
        () => [flattened, data, mergedSelection, mergedPaging, expandedRowKeys, expandAllRows, expandAllGroupRows],
        () => {
            const changes = TableFoundation.deriveState(foundationProps, foundation.getStates(), toFoundationColumns(flattened));
            if (changes) {
                foundation.setState(changes);
            }
            if (committed) {
                foundation.handleUpdate(committed.props, committed.flatten);
            }
            committed = { props: { ...foundationProps }, flatten: foundation.getState('flattenColumns') };
        }
    );

    watch(
        () => currentPage,
        (page) => {
            const current = foundation.getState('pagination');
            // a user's page already reached the foundation when the click went through a pagination.onChange of its own
            followingParent = page !== userPage;
            userPage = undefined;
            if (page !== undefined && !pageControlled && current && current.currentPage !== page) {
                foundation.setPage(page, current.pageSize ?? numbers.DEFAULT_PAGE_SIZE);
            }
            followingParent = false;
        }
    );

    $effect(() => warning(flattened.some(isMissingDataIndex), `[Semi Table] The column with sorter or filter must pass the 'dataIndex' prop`));
    $effect(() => warning(isVirtualized && typeof scroll?.y !== 'number', '[Semi Table] You have to specific "scroll.y" which must be a number for table virtualization!'));

    $effect(() => {
        if (!needSyncTableWidth || !root) {
            return;
        }
        const node = root;
        untrack(syncTableWidth);
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(widthFrame);
            widthFrame = requestAnimationFrame(syncTableWidth);
        });
        observer.observe(node);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(widthFrame);
        };
    });

    // content width changes without a wrapper resize (columns, data) are caught after the update
    $effect(() => {
        void tableColumns;
        void view.dataSource;
        if (!anyColumnFixed || !root) {
            return;
        }
        untrack(foundation.syncScrollEdges);
        const observer = new ResizeObserver(foundation.syncScrollEdges);
        observer.observe(root);
        return () => observer.disconnect();
    });

    onMount(() => {
        committed = { props: { ...foundationProps }, flatten: foundation.getState('flattenColumns') };
    });

    export function getCurrentPageData() {
        return readCurrentPageData();
    }

    export function scrollTo(offset: number) {
        warning(!body?.hasList(), '[Semi Table] scrollTo only works with a mounted virtualized table');
        body?.scrollTo(offset);
    }

    export function scrollToItem(index: number, align?: Parameters<TableHandle['scrollToItem']>[1]) {
        warning(!body?.hasList(), '[Semi Table] scrollToItem only works with a mounted virtualized table');
        body?.scrollToItem(index, align);
    }
</script>

<div bind:this={root} dir={direction ?? config.direction} {...rest} class={[rest.class, `${prefixCls}-wrapper`]} data-column-fixed={String(anyColumnFixed)} style={joinStyles(rest.style, isVirtualized && !/(^|;)\s*width\s*:/.test(rest.style ?? '') && scroll?.x != null && `width: ${toCssLength(scroll.x)}`)}>
    <Spin size="large" spinning={loading}>
        <div
            bind:this={wrap}
            class={{
                [`${prefixCls}-${strings.SIZE_SMALL}`]: size === strings.SIZE_SMALL,
                [`${prefixCls}-${strings.SIZE_MIDDLE}`]: size === strings.SIZE_MIDDLE,
                [`${prefixCls}-virtualized`]: isVirtualized,
                [`${prefixCls}-bordered`]: bordered,
                [`${prefixCls}-fixed-header`]: Boolean(scroll?.y),
            }}
        >
            {#if mergedPagination && (paginationPosition === 'top' || paginationPosition === 'both')}
                <TablePagination {formatPageText} pagination={mergedPagination} />
            {/if}
            {#if hasTitle}
                <div class="{prefixCls}-title" id={titleId} x-semi-prop="title">
                    {#if typeof title === 'function'}{@render title({ pageData })}{:else}{title}{/if}
                </div>
            {/if}
            <div {...splitTable ? nameAttrs : {}} aria-rowcount={isVirtualized ? headerRowCount + virtualizedData.length : undefined} class="{prefixCls}-container" role={splitTable ? 'table' : undefined}>
                {#if fixedHeader}
                    <HeadTable bind:element={head} columns={tableColumns} />
                {/if}
                <Body
                    bind:this={body}
                    columns={tableColumns}
                    dataSource={view.dataSource ?? []}
                    expandedRowKeys={view.expandedRowKeys ?? []}
                    groups={view.groups}
                    includeHeader={!fixedHeader}
                    {onScroll}
                    pageDisabledRowKeysSet={view.pageDisabledRowKeysSet ?? EMPTY_KEYS}
                    tableAttrs={splitTable ? undefined : nameAttrs}
                    {virtualizedData}
                >
                    {#snippet emptyContent()}
                        <div class="{prefixCls}-placeholder">
                            <div class="{prefixCls}-empty" x-semi-prop="empty">
                                {#if empty}{@render empty()}{:else}{locale().locale.emptyText}{/if}
                            </div>
                        </div>
                    {/snippet}
                </Body>
                {#if hasFooter}
                    <div class="{prefixCls}-footer" x-semi-prop="footer">
                        {#if typeof footer === 'function'}{@render footer({ pageData })}{:else}{footer}{/if}
                    </div>
                {/if}
            </div>
            {#if mergedPagination && (paginationPosition === 'bottom' || paginationPosition === 'both')}
                <TablePagination {formatPageText} pagination={mergedPagination} />
            {/if}
        </div>
    </Spin>
</div>
