import React, { Fragment, type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { pick } from 'es-toolkit';
import { numbers } from '@fibrae/semi-foundation/table/constants';
import type { BaseRowKeyType } from '@fibrae/semi-foundation/table/foundation';
import { type BodyRow, type FlattenData, type GroupFlattenData, arrayAdd, buildRecordsByKey, expandBtnShouldInRow, flattenBodyRows, genExpandedRowKey, getRecordKey, getRowSpanHoverKeys, isDisabled, isExpanded, isSelected, resolveVirtualizedItemSize } from '@fibrae/semi-foundation/table/utils';
import warning from '@fibrae/semi-foundation/utils/warning';
import type { BaseProps } from '../../_base/base-component';
import { createContext } from '../../_base/create-context';
import useMergedRef from '../../_base/use-merged-ref';
import useResizeObserver from '../../_base/use-resize-observer';
import VirtualList, { type VirtualListHandle, type VirtualListRowProps } from '../../_base/virtual-list';
import ColGroup from '../col-group';
import type { ExpandedRowRender, TableProps, Virtualized, VirtualizedProps, ColumnProps, Size, BodyScrollEvent, Scroll, TableComponents, RowExpandable, RowKey, OnRow, ExpandIcon, OnHeaderRow, RenderGroupSection, OnGroupedRow } from '../interface';
import { useTableContext } from '../table-context';
import TableHeader from '../table-header';
import BaseRow, { type BaseRowProps, baseRowPropKeys } from './base-row';
import ExpandedRow from './expanded-row';
import SectionRow, { sectionRowPropKeys } from './section-row';

export interface BodyProps extends BaseProps {
    tableLayout?: 'fixed' | 'auto';
    anyColumnFixed?: boolean;
    columns?: ColumnProps[];
    dataSource?: Record<string, any>[];
    pageDisabledRowKeysSet: Set<any>;
    emptySlot?: ReactNode;
    expandedRowKeys?: (string | number)[];
    expandedRowRender?: ExpandedRowRender<any>;
    handleBodyScroll?: (e: BodyScrollEvent) => void;
    includeHeader?: boolean;
    prefixCls?: string;
    scroll?: Scroll;
    selectedRowKeysSet: Set<any>;
    showHeader?: boolean;
    size?: Size;
    virtualized?: Virtualized;
    /** The rows a virtualized body renders, flattened by Table */
    virtualizedData?: Array<FlattenData | GroupFlattenData>;
    components?: TableComponents;
    groups?: Map<string | number, Set<string | number>>;
    rowKey?: RowKey<any>;
    childrenRecordName?: string;
    rowExpandable?: RowExpandable<any>;
    renderExpandIcon: (record: Record<string, any>, isNested: boolean) => ReactNode | null;
    headerRef?: React.Ref<HTMLElement>;
    keepDOM?: boolean;
    onRow?: OnRow<any>;
    onRowContextMenu?: TableProps['onRowContextMenu'];
    onRowDoubleClick?: TableProps['onRowDoubleClick'];
    onRowMouseEnter?: TableProps['onRowMouseEnter'];
    onRowMouseLeave?: TableProps['onRowMouseLeave'];
    onHeaderRow?: OnHeaderRow<any>;
    expandIcon?: ExpandIcon;
    expandRowByClick?: boolean;
    indentSize?: number;
    hideExpandedColumn?: boolean;
    renderGroupSection?: RenderGroupSection;
    onGroupedRow?: OnGroupedRow<any>;
    clickGroupedRowToExpand?: boolean;
    bodyHasScrollBar?: boolean;
    /** Attached to the body wrapper div (the scroll container) */
    ref?: React.Ref<HTMLDivElement>;
}

interface VirtualizedBodyContextValue {
    prefixCls: string;
    tableWidth: number;
    emptySlot: ReactNode;
    onBodyScroll?: (e: BodyScrollEvent) => void;
}

// Module-level list components (a new type per render would remount the list) read their values through this context
const [VirtualizedBodyContext, useVirtualizedBodyContext] = createContext<VirtualizedBodyContextValue>('Table');

function VirtualizedTbody({ className, ...rest }: React.ComponentProps<'div'>) {
    const { prefixCls } = useVirtualizedBodyContext('Table.VirtualizedTbody');

    return <div {...rest} className={clsx(className, `${prefixCls}-tbody`)} role="rowgroup" />;
}

function VirtualizedOuter({ children, onScroll, ...rest }: React.ComponentProps<'div'>) {
    const { prefixCls, tableWidth, emptySlot, onBodyScroll } = useVirtualizedBodyContext('Table.VirtualizedOuter');

    return (
        <div
            {...rest}
            // rows are not focusable; the keyboard scrolls the list through this element
            tabIndex={0}
            onScroll={(e) => {
                onBodyScroll?.(e);
                onScroll?.(e);
            }}
        >
            <div
                className={clsx(prefixCls, `${prefixCls}-fixed`)}
                style={{ width: tableWidth }}
                // display: table would make Chrome expose a layout table between rows and the container table
                role="none"
            >
                {children}
            </div>
            {emptySlot}
        </div>
    );
}

interface VirtualizedRowData {
    items: Array<FlattenData | GroupFlattenData>;
    renderRow: (index: number, style: React.CSSProperties) => ReactNode;
}

// memo: a scroll renders only VirtualList, which passes the same data and a cached style to rows that stay in view
const VirtualizedRow = React.memo(function VirtualizedRow({ index, style, data }: VirtualListRowProps<VirtualizedRowData>) {
    return data.renderRow(index, style);
});

function getVirtualizedItemKey(index: number, data: VirtualizedRowData) {
    const item: any = data.items[index];
    if (!item) {
        return index;
    }
    // The kind prefix keeps a group key apart from an equal record key in the one flat list
    return `${item.sectionRow ? 'section' : item.expandedRow ? 'expanded' : 'base'}:${item.key}`;
}

const EMPTY_FLATTEN_DATA: Array<FlattenData | GroupFlattenData> = [];

export default function Body(props: BodyProps) {
    const {
        ref,
        virtualized,
        virtualizedData = EMPTY_FLATTEN_DATA,
        dataSource,
        expandedRowKeys,
        expandedRowRender,
        rowKey,
        childrenRecordName,
        groups,
        hideExpandedColumn,
        rowExpandable,
        scroll,
        prefixCls,
        columns,
        components,
        headerRef,
        handleBodyScroll,
        anyColumnFixed,
        showHeader,
        emptySlot,
        includeHeader,
        tableLayout,
        keepDOM,
        size: tableSize,
    } = props;

    const { flattenedColumns, getCellWidths, rowSpanHover, setBodyHasScrollbar, getVirtualizedListRef, handleRowExpanded, direction, splitTable, tableAria } = useTableContext('Table.Body');

    const [hoveredRowKey, setHoveredRowKey] = useState<string | number>(null);
    const bodyNode = useRef<HTMLDivElement>(null);
    const listInstance = useRef<VirtualListHandle>(null);
    const highlightedRowKeys = useRef<Set<string>>(new Set());

    // also kept in state so the observer below can start and stop as scroll.y comes and goes
    const [bodyElement, setBodyElement] = useState<HTMLDivElement>(null);

    // itemSize runs for every row on each measure; one warning is enough
    const itemSizeWarned = useRef(false);
    const scrollbarFrameRef = useRef(0);

    const scrollY = scroll?.y;

    const expandBtnInRow = useMemo(
        () =>
            expandBtnShouldInRow({
                expandedRowRender,
                dataSource,
                hideExpandedColumn,
                childrenRecordName,
                rowExpandable,
            }),
        [expandedRowRender, dataSource, hideExpandedColumn, childrenRecordName, rowExpandable]
    );

    // memoized so a row re-renders only when columns or widths change (#686)
    const rowCellWidths = useMemo(() => getCellWidths(flattenedColumns), [getCellWidths, flattenedColumns]);
    const recordsByKey = useMemo(() => (groups instanceof Map ? buildRecordsByKey(dataSource, rowKey) : new Map<BaseRowKeyType, Record<string, any>>()), [groups, dataSource, rowKey]);

    // an inline virtualized object is new on every parent render; only whether it is set and its itemSize matter here
    const isVirtualized = Boolean(virtualized);
    const itemSizeOption = typeof virtualized === 'object' ? virtualized.itemSize : undefined;
    const scrollYIsNumber = typeof scrollY === 'number';

    /**
     * Observes the body size when scroll.y is set: the separate header reserves the width of a vertical scrollbar
     * the body shows (#1219)
     */
    const observeBody = Boolean(scrollY);

    const setBodyNode = useCallback((node: HTMLDivElement | null) => {
        bodyNode.current = node;
    }, []);

    const attachBody = useMergedRef(setBodyNode, setBodyElement, ref);

    const attachList = useCallback(
        (instance: VirtualListHandle) => {
            listInstance.current = instance;
            if (getVirtualizedListRef) {
                if (isVirtualized) {
                    getVirtualizedListRef(listInstance);
                } else {
                    console.warn('getVirtualizedListRef only works with virtualized.');
                }
            }
        },
        [getVirtualizedListRef, isVirtualized]
    );

    const updateRowHoverClass = useCallback(
        (nextSet: Set<string>) => {
            const node = bodyNode.current;
            if (!node) {
                highlightedRowKeys.current.clear();
                return;
            }

            const root: HTMLElement = (node.closest?.(`.${prefixCls}-wrapper`) as HTMLElement) || node;

            for (const key of highlightedRowKeys.current) {
                if (!nextSet.has(key)) {
                    const rows = root.querySelectorAll(`tr[data-row-key="${CSS.escape(key)}"]`);
                    rows.forEach((r) => r.classList.remove(`${prefixCls}-row-hovered`));
                }
            }

            for (const key of nextSet) {
                if (!highlightedRowKeys.current.has(key)) {
                    const rows = root.querySelectorAll(`tr[data-row-key="${CSS.escape(key)}"]`);
                    rows.forEach((r) => r.classList.add(`${prefixCls}-row-hovered`));
                }
            }

            highlightedRowKeys.current = nextSet;
        },
        [prefixCls]
    );

    /**
     * Updates hoveredRowKey; with rowSpanHover also highlights all rows covered by rowSpan cells
     */
    const onRowHover = useCallback(
        (isHover: boolean, rowKeyOfRow: string | number) => {
            setHoveredRowKey(isHover ? rowKeyOfRow : null);

            if (rowSpanHover) {
                updateRowHoverClass(isHover ? getRowSpanHoverKeys(bodyNode.current, String(rowKeyOfRow)) : new Set());
            }
        },
        [rowSpanHover, updateRowHoverClass]
    );

    const handleRowClick = useCallback(
        (clickedRowKey: BaseRowKeyType, e: React.MouseEvent<HTMLElement>, expand: boolean) => {
            handleRowExpanded(!expand, clickedRowKey, e);
        },
        [handleRowExpanded]
    );

    const handleVirtualizedScroll = (scrollProps = {}) => {
        const virtualizedOnScroll = (virtualized as VirtualizedProps)?.onScroll;
        if (typeof virtualizedOnScroll === 'function') {
            virtualizedOnScroll(scrollProps);
        }
    };

    const itemSize = (index: number) => {
        const virtualizedItem = virtualizedData[index] as Partial<FlattenData & GroupFlattenData> | undefined;
        const { size, minHeight } = resolveVirtualizedItemSize(itemSizeOption, tableSize, index, { expandedRow: Boolean(virtualizedItem?.expandedRow), sectionRow: Boolean(virtualizedItem?.sectionRow) });

        if (size < minHeight && !itemSizeWarned.current) {
            itemSizeWarned.current = true;
            warning(true, `[Semi Table] The computed real \`itemSize\` cannot be less than ${minHeight}`);
        }

        return size;
    };

    const renderSectionRow = (rowProps: RenderSectionRowProps = { groupKey: undefined }) => {
        const { group, groupKey, index } = rowProps;
        const sectionRowProps: any = pick(rowProps as Record<string, any>, sectionRowPropKeys);

        return (
            <SectionRow
                {...sectionRowProps}
                key={groupKey ?? index}
                data={dataSource}
                index={index}
                record={{
                    groupKey,
                    records: [...group].map((recordKey) => recordsByKey.get(recordKey)),
                }}
                onExpand={handleRowExpanded}
            />
        );
    };

    const renderExpandedRow = (rowProps: RenderExpandedRowProps = { renderExpandIcon: () => null }) => {
        const { style, record, columns: rowColumns, expanded, index, displayNone } = rowProps;
        let key = getRecordKey(record, rowKey);

        if (key == null) {
            key = index;
        }

        return (
            <ExpandedRow
                key={genExpandedRowKey(key)}
                style={style}
                cellWidths={rowCellWidths}
                columns={rowColumns}
                components={components}
                displayNone={displayNone}
                expanded={expanded}
                index={index}
                record={record}
                rowKey={key}
                virtualized={virtualized}
                expandedRowRender={expandedRowRender}
                renderExpandIcon={rowProps.renderExpandIcon}
            />
        );
    };

    const renderBaseRow = (rowProps: any = {}) => {
        const { record, index, level, expandBtnShouldInRow: expandBtnInThisRow, expandRowByClick } = rowProps;

        const baseRowProps = pick(rowProps, baseRowPropKeys) as BaseRowProps;

        let key = getRecordKey(record, rowKey);

        if (key == null) {
            key = index;
        }

        const expanded = isExpanded(expandedRowKeys, key);
        const expandable = rowExpandable && rowExpandable(record);

        const expandableProps: {
            level?: number;
            expanded?: boolean;
            expandableRow?: boolean;
            onRowClick?: (...args: any[]) => void;
        } = {
            level: undefined,
            expanded,
        };

        if (expandable || expandBtnInThisRow) {
            expandableProps.level = level;
            expandableProps.expandableRow = expandable;
            if (expandRowByClick && expandable) {
                expandableProps.onRowClick = handleRowClick;
            }
        }

        return <BaseRow {...baseRowProps} {...expandableProps} key={key} disabled={isDisabled(props.pageDisabledRowKeysSet, key)} cellWidths={rowCellWidths} hovered={hoveredRowKey === key} rowKey={key} selected={isSelected(props.selectedRowKeysSet, key)} onHover={onRowHover} />;
    };

    const renderBodyRow = (row: BodyRow) => {
        if (row.kind === 'section') {
            return renderSectionRow({ ...props, columns: flattenedColumns, index: row.index, group: row.group, groupKey: row.key, expanded: row.expanded });
        }
        if (row.kind === 'expanded') {
            return renderExpandedRow({ ...props, columns: flattenedColumns, index: row.index, record: row.record, expanded: row.expanded, displayNone: row.displayNone });
        }
        return renderBaseRow({ ...props, columns: flattenedColumns, expandBtnShouldInRow: expandBtnInRow, displayNone: row.displayNone, record: row.record, key: row.key, level: row.level, index: row.index });
    };

    const renderBodyRows = () => {
        const rows = flattenBodyRows({ rowKey, childrenRecordName, expandedRowKeys, hasExpandedRow: typeof expandedRowRender === 'function', keepDOM, rowExpandable }, dataSource, groups, recordsByKey);
        if (!(groups instanceof Map)) {
            return rows.map(renderBodyRow);
        }
        const sectionIndexes = rows.flatMap((row, index) => (row.kind === 'section' ? [index] : []));
        return sectionIndexes.flatMap((start, n) => {
            const section = rows[start] as Extract<BodyRow, { kind: 'section' }>;
            const groupRows = rows.slice(start + 1, sectionIndexes[n + 1]).map(renderBodyRow);
            // keyed so a group's rows keep their identity when an earlier group collapses; the prefix keeps the key
            // apart from a section row whose group key equals a record key
            return section.expanded || keepDOM ? [renderBodyRow(section), <Fragment key={`group-rows:${section.key}`}>{groupRows}</Fragment>] : [renderBodyRow(section)];
        });
    };

    useResizeObserver(
        bodyElement,
        () => {
            window.cancelAnimationFrame(scrollbarFrameRef.current);
            scrollbarFrameRef.current = window.requestAnimationFrame(() => setBodyHasScrollbar(bodyElement.clientWidth < bodyElement.offsetWidth));
        },
        { enabled: observeBody }
    );

    useLayoutEffect(() => () => window.cancelAnimationFrame(scrollbarFrameRef.current), [bodyElement, observeBody]);

    // The list caches row offsets; expanding, sorting or filtering changes the row kind (size) at an index, and the
    // size preset or itemSize changes every size
    useLayoutEffect(() => {
        listInstance.current?.measure();
    }, [virtualizedData, isVirtualized, tableSize, itemSizeOption]);

    useEffect(() => {
        warning(isVirtualized && !scrollYIsNumber, '[Semi Table] You have to specific "scroll.y" which must be a number for table virtualization!');
    }, [isVirtualized, scrollYIsNumber]);

    if (virtualized) {
        const cellWidths = getCellWidths(columns);

        if (!(cellWidths?.length ?? 0)) {
            return null;
        }

        const y = scrollYIsNumber ? scrollY : numbers.DEFAULT_VIRTUALIZED_BODY_HEIGHT;

        const rowWidth = arrayAdd(cellWidths, 0, columns?.length ?? 0);

        const renderRow = (index: number, style: React.CSSProperties) => {
            const virtualizedItem: any = virtualizedData[index] ?? {};
            const { key, expandedRow, sectionRow, ...rest } = virtualizedItem;

            const rowProps = {
                ...props,
                style: {
                    ...style,
                    width: rowWidth,
                },
                ...rest,
                columns: flattenedColumns,
                index,
                expandBtnShouldInRow: expandBtnInRow,
            };
            return sectionRow ? renderSectionRow(rowProps) : expandedRow ? renderExpandedRow(rowProps) : renderBaseRow(rowProps);
        };

        return (
            <VirtualizedBodyContext
                value={{
                    prefixCls,
                    tableWidth: rowWidth,
                    emptySlot: (dataSource?.length ?? 0) === 0 && emptySlot,
                    onBodyScroll: handleBodyScroll,
                }}
            >
                <VirtualList<VirtualizedRowData>
                    ref={attachList}
                    className={`${prefixCls}-body`}
                    style={{
                        width: '100%',
                        height: virtualizedData?.length ? y : null,
                        overflowX: 'auto',
                        overflowY: 'auto',
                        direction,
                    }}
                    height={virtualizedData?.length ? y : 0}
                    innerElementType={VirtualizedTbody}
                    itemCount={virtualizedData.length}
                    itemData={{ items: virtualizedData, renderRow }}
                    itemKey={getVirtualizedItemKey}
                    itemSize={itemSize}
                    outerElementType={VirtualizedOuter}
                    outerRef={attachBody}
                    overscan={typeof virtualized === 'object' ? virtualized.overscanCount : undefined}
                    width="100%"
                    onScroll={handleVirtualizedScroll}
                >
                    {VirtualizedRow}
                </VirtualList>
            </VirtualizedBodyContext>
        );
    }

    const x = scroll?.x;
    const y = scroll?.y;

    const bodyStyle: {
        maxHeight?: string | number;
        overflow?: string;
    } = {};

    const tableStyle: {
        width?: string | number;
    } = {};

    const Table = components?.body?.outer ?? 'table';
    const BodyWrapper = components?.body?.wrapper || 'tbody';

    if (y) {
        bodyStyle.maxHeight = y;
    }

    if (x) {
        tableStyle.width = x;
    }

    if (anyColumnFixed && (dataSource?.length ?? 0)) {
        // auto, not scroll: with only scrollY no horizontal scrollbar should show
        bodyStyle.overflow = 'auto';
    }

    return (
        <div
            key="bodyTable"
            ref={attachBody}
            className={`${prefixCls}-body`}
            style={bodyStyle}
            // a scroll.y body must be keyboard reachable even without a focusable cell
            tabIndex={y ? 0 : undefined}
            onMouseLeave={() => {
                if (rowSpanHover) {
                    updateRowHoverClass(new Set());
                }
            }}
            onScroll={handleBodyScroll}
        >
            <Table
                className={clsx(prefixCls, {
                    [`${prefixCls}-fixed`]: tableLayout === 'fixed',
                })}
                style={tableStyle}
                // a table, not a grid (no arrow-key navigation); with a separate header the container is the table
                role={splitTable ? 'none' : 'table'}
                {...(splitTable ? null : tableAria)}
            >
                <ColGroup columns={columns} components={components?.body} prefixCls={prefixCls} />
                {/* without a header the fixed columns still need its measured widths for their offsets */}
                {includeHeader && (showHeader || anyColumnFixed) && <TableHeader ref={headerRef} hidden={!showHeader} bodyHasScrollBar={props.bodyHasScrollBar} columns={columns} components={components} prefixCls={prefixCls} onHeaderRow={props.onHeaderRow} />}
                <BodyWrapper
                    className={`${prefixCls}-tbody`}
                    // a tbody under a role="none" table would be presentational too
                    role={splitTable ? 'rowgroup' : undefined}
                >
                    {renderBodyRows()}
                </BodyWrapper>
            </Table>
            {emptySlot}
        </div>
    );
}

export interface RenderExpandedRowProps {
    style?: React.CSSProperties;
    components?: TableComponents;
    renderExpandIcon: (record?: Record<string, any>, isNested?: boolean) => ReactNode | null;
    expandedRowRender?: ExpandedRowRender<Record<string, any>>;
    record?: Record<string, any>;
    columns?: ColumnProps[];
    expanded?: boolean;
    index?: number;
    rowKey?: RowKey<Record<string, any>>;
    virtualized?: Virtualized;
    level?: number;
    keepDOM?: boolean;
    displayNone?: boolean;
}

export interface RenderSectionRowProps {
    dataSource?: Record<string, any>[];
    columns?: ColumnProps[];
    rowKey?: RowKey<Record<string, any>>;
    group?: any;
    groupKey: string | number;
    index?: number;
    expanded?: boolean;
}
