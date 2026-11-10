import { type JSX, For, Show, createEffect, createMemo, createSelector, createSignal, on, splitProps, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { numbers } from '@fibrae/semi-foundation/components/table/constants';
import type { BaseRowKeyType } from '@fibrae/semi-foundation/components/table/foundation';
import {
    type ExpandBtnShouldInRowProps,
    type FlattenData,
    type GroupFlattenData,
    arrayAdd,
    buildRecordsByKey,
    expandBtnShouldInRow,
    flattenBodyRows,
    getColumnsMinWidth,
    getRecordKey,
    getRowSpanHoverKeys,
    isDisabled,
    isExpanded,
    isSelected,
    resolveVirtualizedItemSize,
} from '@fibrae/semi-foundation/components/table/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import warning from '@fibrae/semi-foundation/utils/warning';
import VirtualList, { type VirtualListHandle } from '../../../internal/virtual-list';
import useRaf from '../../../primitives/use-raf';
import useResizeObserver from '../../../primitives/use-resize-observer';
import callHandler from '../../../utils/call-handler';
import mergeStyles from '../../../utils/merge-styles';
import useLocale from '../../locale/use-locale';
import ColGroup from '../col-group';
import { useTableContext } from '../context';
import type { ColumnProps } from '../interface';
import TableHeader from '../table-header/table-header';
import BaseRow from './base-row';
import ExpandedRow from './expanded-row';
import SectionRow, { type SectionRowProps } from './section-row';

type AnyRecord = Record<string, any>;

export interface BodyProps {
    columns: ColumnProps[];
    includeHeader?: boolean;
    emptySlot?: JSX.Element;
    ref?: (element: HTMLDivElement) => void;
    headerRef?: (element: HTMLElement) => void;
}

type BodyRow =
    | { kind: 'base'; id: string; key: BaseRowKeyType; record: AnyRecord; index: number; level: number; displayNone: boolean }
    | { kind: 'expanded'; id: string; key: BaseRowKeyType; record: AnyRecord; index: number; expanded: boolean; displayNone: boolean }
    | { kind: 'section'; id: string; key: BaseRowKeyType; record: SectionRowProps['record']; group: BaseRowKeyType[]; index: number; expanded: boolean; displayNone: boolean };

const sameKeys = (a: BaseRowKeyType[], b: BaseRowKeyType[]) => a.length === b.length && a.every((key, index) => key === b[index]);

export default function Body(props: BodyProps) {
    const table = useTableContext('Table.Body');
    const locale = useLocale('Table');

    const [hoveredRowKey, setHoveredRowKey] = createSignal<BaseRowKeyType | null>(null);
    const [bodyElement, setBodyElement] = createSignal<HTMLDivElement>();
    const [tableElement, setTableElement] = createSignal<HTMLElement>();

    // whether the body overflows, so it takes keyboard focus to scroll; known after mount
    const [overflows, setOverflows] = createSignal(false);
    let highlightedRowKeys = new Set<string>();
    let list: VirtualListHandle | undefined;

    // itemSize runs for every row on each measure; one warning is enough
    let itemSizeWarned = false;

    const scheduleScrollbarCheck = useRaf();

    const isHovered = createSelector(hoveredRowKey);
    const rowCellWidths = createMemo(() => table.getCellWidths(table.flattenedColumns()));
    const cellWidths = createMemo(() => table.getCellWidths(props.columns));

    const prefixCls = () => table.view().prefixCls;

    const dataSource = () => table.state().dataSource ?? [];

    const expandBtnInRow = createMemo(() =>
        expandBtnShouldInRow({
            // only whether it is a function is read
            expandedRowRender: table.props.expandedRowRender as ExpandBtnShouldInRowProps['expandedRowRender'],
            dataSource: dataSource(),
            hideExpandedColumn: Boolean(table.props.hideExpandedColumn),
            childrenRecordName: table.props.childrenRecordName ?? 'children',
            rowExpandable: (record) => table.rowExpandable(record ?? {}),
        })
    );

    const hasExpandedRowRender = () => typeof table.props.expandedRowRender === 'function';

    const virtualized = () => Boolean(table.props.virtualized);

    /**
     * Base rows with their expanded rows and the shown tree children, under the section row of their group when
     * grouped; under keepDOM collapsed rows stay, hidden. A virtualized body takes the flattened rows of the table,
     * which leave collapsed rows out. Ids are strings so a row keeps its DOM while its record object is replaced.
     */
    const rows = createMemo(() => {
        const list: BodyRow[] = [];
        const seen = new Map<string, number>();
        const uniqueId = (base: string) => {
            const count = seen.get(base) ?? 0;
            seen.set(base, count + 1);
            return count ? `${base}#${count}` : base;
        };
        const rowKey = table.props.rowKey ?? 'key';
        const keyOf = (record: AnyRecord, index: number): BaseRowKeyType => getRecordKey(record, rowKey) ?? index;
        const groups = table.state().groups;
        const recordsByKey = groups instanceof Map ? buildRecordsByKey(dataSource(), rowKey) : new Map<BaseRowKeyType, AnyRecord>();
        const pushSection = (groupKey: BaseRowKeyType, group: BaseRowKeyType[], index: number, expanded: boolean) => {
            list.push({ kind: 'section', id: uniqueId(`s:${String(groupKey)}`), key: groupKey, record: { groupKey, records: group.map((key) => recordsByKey.get(key)) as AnyRecord[] }, group, index, expanded, displayNone: false });
        };

        if (virtualized()) {
            table.virtualizedData().forEach((item, index) => {
                if (item.sectionRow) {
                    const section = item as GroupFlattenData;
                    pushSection(section.groupKey, [...section.group], index, section.expanded);
                    return;
                }
                const { record, level, expandedRow } = item as FlattenData;
                const key = keyOf(record, index);
                if (expandedRow) {
                    list.push({ kind: 'expanded', id: uniqueId(`e:${String(key)}`), key, record, index, expanded: true, displayNone: false });
                } else {
                    list.push({ kind: 'base', id: uniqueId(`b:${String(key)}`), key, record, index, level, displayNone: false });
                }
            });
            return list;
        }

        const bodyRows = flattenBodyRows(
            {
                rowKey,
                childrenRecordName: table.props.childrenRecordName,
                expandedRowKeys: table.state().expandedRowKeys ?? [],
                hasExpandedRow: hasExpandedRowRender(),
                keepDOM: table.props.keepDOM,
                rowExpandable: table.rowExpandable,
            },
            dataSource(),
            groups,
            recordsByKey
        );
        for (const row of bodyRows) {
            if (row.kind === 'section') {
                pushSection(row.key, [...row.group], row.index, row.expanded);
            } else {
                list.push({ ...row, id: uniqueId(`${row.kind === 'base' ? 'b' : 'e'}:${String(row.key)}`) });
            }
        }
        return list;
    });

    const rowsById = createMemo(() => new Map(rows().map((row) => [row.id, row])));
    const rowIds = createMemo(() => rows().map((row) => row.id));

    const virtualizedOptions = () => (typeof table.props.virtualized === 'object' ? table.props.virtualized : undefined);

    const updateRowHoverClass = (nextSet: Set<string>) => {
        const node = bodyElement();
        if (!node) {
            highlightedRowKeys.clear();
            return;
        }
        const root: HTMLElement = node.closest<HTMLElement>(`.${prefixCls()}-wrapper`) ?? node;
        for (const key of highlightedRowKeys) {
            if (!nextSet.has(key)) {
                root.querySelectorAll(`tr[data-row-key="${CSS.escape(key)}"]`).forEach((row) => row.classList.remove(`${prefixCls()}-row-hovered`));
            }
        }
        for (const key of nextSet) {
            if (!highlightedRowKeys.has(key)) {
                root.querySelectorAll(`tr[data-row-key="${CSS.escape(key)}"]`).forEach((row) => row.classList.add(`${prefixCls()}-row-hovered`));
            }
        }
        highlightedRowKeys = nextSet;
    };

    const onRowHover = (isHover: boolean, rowKey: BaseRowKeyType) => {
        setHoveredRowKey(isHover ? rowKey : null);
        if (table.props.rowSpanHover) {
            updateRowHoverClass(isHover ? getRowSpanHoverKeys(bodyElement(), String(rowKey)) : new Set());
        }
    };

    const handleRowClick = (rowKey: BaseRowKeyType, e: MouseEvent, expanded: boolean) => table.handleRowExpanded(!expanded, rowKey, e);

    const renderRow = (id: string, style?: () => JSX.CSSProperties) => {
        let last: BodyRow;
        // the last row stays readable while For removes this one
        const row = () => (last = rowsById().get(id) ?? last);
        // The row objects are rebuilt whenever the rows change; the fields go through memos so a row whose own fields
        // stay the same keeps its cells, and their expand buttons keep focus
        const record = createMemo(() => row().record);
        const index = createMemo(() => row().index);
        const rowKey = createMemo(() => row().key);
        const displayNone = createMemo(() => row().displayNone);
        const level = createMemo(() => {
            const current = row();
            return current.kind === 'base' ? current.level : 0;
        });
        const expanded = createMemo(() => {
            const current = row();
            return current.kind !== 'base' && current.expanded;
        });
        const group = createMemo(
            () => {
                const current = row();
                return current.kind === 'section' ? current.group : [];
            },
            [],
            { equals: sameKeys }
        );
        const rowStyle = () => style?.();
        if (id.startsWith('s:')) {
            return <SectionRow expanded={expanded()} group={group()} groupKey={rowKey() as string | number} index={index()} record={record() as SectionRowProps['record']} style={rowStyle()} />;
        }
        if (id.startsWith('e:')) {
            return <ExpandedRow cellWidths={rowCellWidths()} columns={table.flattenedColumns()} displayNone={displayNone()} expanded={expanded()} expandedRowRender={table.props.expandedRowRender} index={index()} record={record()} rowKey={rowKey()} style={rowStyle()} />;
        }
        return <BaseRowOfRecord record={record()} index={index()} level={level()} rowKey={rowKey()} displayNone={displayNone()} cellWidths={rowCellWidths()} expandBtnInRow={expandBtnInRow()} hovered={isHovered(rowKey())} style={rowStyle()} onHover={onRowHover} onRowClick={handleRowClick} />;
    };

    const bodyStyle = () => {
        const style: JSX.CSSProperties = {};
        const y = table.props.scroll?.y;
        if (y) {
            style['max-height'] = toCssLength(y);
        }
        if (table.view().anyColumnFixed && dataSource().length) {
            // auto, not scroll: with only scrollY no horizontal scrollbar should show
            style.overflow = 'auto';
        }
        return style;
    };

    const attachBody = (node: HTMLDivElement) => {
        setBodyElement(node);
        props.ref?.(node);
    };

    const rowWidth = () => arrayAdd(cellWidths(), 0, props.columns.length);

    const itemSize = (index: number) =>
        untrack(() => {
            const item = rows()[index];
            const { size, minHeight } = resolveVirtualizedItemSize(virtualizedOptions()?.itemSize, table.props.size, index, { expandedRow: item?.kind === 'expanded', sectionRow: item?.kind === 'section' });
            if (size < minHeight && !itemSizeWarned) {
                itemSizeWarned = true;
                warning(true, `[Semi Table] The computed real \`itemSize\` cannot be less than ${minHeight}`);
            }
            return size;
        });

    const VirtualizedOuter = (outer: JSX.HTMLAttributes<HTMLDivElement>) => {
        const [own, rest] = splitProps(outer, ['children', 'onScroll']);
        return (
            <div
                {...rest}
                // rows are not focusable; the keyboard scrolls the list through this element
                tabIndex={0}
                onScroll={(e) => {
                    table.handleBodyScroll(e);
                    callHandler(own.onScroll, e);
                }}
            >
                <div
                    class={clsx(prefixCls(), `${prefixCls()}-fixed`)}
                    style={{ width: toCssLength(rowWidth()) }}
                    // display: table would make Chrome expose a layout table between rows and the container table
                    role="none"
                >
                    {own.children}
                </div>
                {props.emptySlot}
            </div>
        );
    };

    const VirtualizedTbody = (inner: { style?: JSX.CSSProperties; children?: JSX.Element }) => (
        <div style={inner.style} class={`${prefixCls()}-tbody`} role="rowgroup">
            {inner.children}
        </div>
    );

    const measureOverflow = () => {
        const element = bodyElement();
        if (element) {
            setOverflows(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight);
        }
    };

    // a scrolling body must be keyboard reachable even without a focusable cell
    const scrollable = () => Boolean(table.props.scroll?.y) || overflows();

    /**
     * Observes the body size when scroll.y is set: the separate header reserves the width of a vertical scrollbar
     * the body shows (#1219)
     */
    useResizeObserver(
        () => (table.props.scroll?.y ? bodyElement() : null),
        () => {
            const element = bodyElement();
            scheduleScrollbarCheck(() => {
                if (element) {
                    table.setBodyHasScrollbar(element.clientWidth < element.offsetWidth);
                }
            });
        }
    );

    // a scroll.y body scrolls anyway; the table is observed too, as new columns or rows can overflow the body without
    // resizing it
    useResizeObserver(() => (table.props.scroll?.y ? null : bodyElement()), measureOverflow);
    useResizeObserver(() => (table.props.scroll?.y ? null : tableElement()), measureOverflow);

    // The list caches row offsets; expanding, sorting or filtering changes the row kind (size) at an index, and the
    // size preset or itemSize changes every size
    createEffect(on([rows, () => table.props.size, () => virtualizedOptions()?.itemSize], () => list?.measure(), { defer: true }));
    createEffect(() => warning(virtualized() && typeof table.props.scroll?.y !== 'number', '[Semi Table] You have to specific "scroll.y" which must be a number for table virtualization!'));

    return (
        <Show
            when={virtualized()}
            fallback={
                <div
                    ref={(node) => attachBody(node)}
                    class={`${prefixCls()}-body`}
                    style={bodyStyle()}
                    // a group between the role="table" container and the rows of a split table would break the table
                    aria-label={scrollable() && !table.view().splitTable ? locale().locale.scrollRegion : undefined}
                    role={scrollable() && !table.view().splitTable ? 'group' : undefined}
                    tabIndex={scrollable() ? 0 : undefined}
                    onMouseLeave={() => {
                        if (table.props.rowSpanHover) {
                            updateRowHoverClass(new Set());
                        }
                    }}
                    onScroll={(e) => table.handleBodyScroll(e)}
                >
                    <Dynamic
                        component={table.view().components.body.outer}
                        ref={setTableElement}
                        class={clsx(prefixCls(), { [`${prefixCls()}-fixed`]: table.view().tableLayout === 'fixed' })}
                        style={{ width: toCssLength(table.props.scroll?.x), 'min-width': toCssLength(getColumnsMinWidth(table.flattenedColumns())) }}
                        // a table, not a grid (no arrow-key navigation); with a separate header the container is the table
                        role={table.view().splitTable ? 'none' : 'table'}
                        {...(table.view().splitTable ? {} : table.tableAria())}
                    >
                        <ColGroup columns={props.columns} components={table.view().components.body} />
                        {/* without a header the fixed columns still need its measured widths for their offsets */}
                        <Show when={props.includeHeader && (table.props.showHeader || table.view().anyColumnFixed)}>
                            <TableHeader ref={(element) => props.headerRef?.(element)} hidden={!table.props.showHeader} columns={props.columns} />
                        </Show>
                        <Dynamic
                            component={table.view().components.body.wrapper}
                            class={`${prefixCls()}-tbody`}
                            // a tbody under a role="none" table would be presentational too
                            role={table.view().splitTable ? 'rowgroup' : undefined}
                        >
                            <For each={rowIds()}>{(id) => renderRow(id)}</For>
                        </Dynamic>
                    </Dynamic>
                    {props.emptySlot}
                </div>
            }
        >
            {/* the rows are sized by the header's measured widths, so the list waits for them */}
            <Show when={cellWidths().length}>
                <VirtualList<BodyRow[]>
                    ref={(handle) => {
                        list = handle;
                        if (handle) {
                            table.props.getVirtualizedListRef?.(handle);
                        }
                    }}
                    class={`${prefixCls()}-body`}
                    // an empty table drops the list height so the empty slot shows
                    style={{ width: '100%', 'overflow-x': 'auto', 'overflow-y': 'auto', direction: table.view().direction, ...(rows().length ? {} : { height: undefined }) }}
                    height={rows().length ? (typeof table.props.scroll?.y === 'number' ? table.props.scroll.y : numbers.DEFAULT_VIRTUALIZED_BODY_HEIGHT) : 0}
                    innerElementType={VirtualizedTbody}
                    itemCount={rows().length}
                    itemData={rows()}
                    itemKey={(index, data) => data[index]?.id ?? index}
                    itemSize={itemSize}
                    outerElementType={VirtualizedOuter}
                    outerRef={(node) => attachBody(node)}
                    overscan={virtualizedOptions()?.overscanCount}
                    onScroll={(args) => virtualizedOptions()?.onScroll?.(args)}
                >
                    {(row) =>
                        renderRow(
                            untrack(() => row.data[row.index].id),
                            () => mergeStyles(row.style, { width: toCssLength(rowWidth()) }) as JSX.CSSProperties
                        )
                    }
                </VirtualList>
            </Show>
        </Show>
    );
}

interface BaseRowOfRecordProps {
    record: AnyRecord;
    index: number;
    level: number;
    rowKey: BaseRowKeyType;
    displayNone: boolean;
    cellWidths: number[];
    expandBtnInRow: boolean;
    hovered: boolean;
    style?: JSX.CSSProperties;
    onHover: (isHover: boolean, rowKey: BaseRowKeyType) => void;
    onRowClick: (rowKey: BaseRowKeyType, e: MouseEvent, expanded: boolean) => void;
}

/** A data row with the expansion, selection and disabled state of its record */
function BaseRowOfRecord(props: BaseRowOfRecordProps) {
    const table = useTableContext('Table.Body');

    const expandable = () => table.rowExpandable(props.record);

    const expanded = () => isExpanded(table.state().expandedRowKeys ?? [], props.rowKey);

    const withExpansion = () => expandable() || props.expandBtnInRow;

    return (
        <BaseRow
            columns={table.flattenedColumns()}
            cellWidths={props.cellWidths}
            disabled={isDisabled(table.state().pageDisabledRowKeysSet ?? new Set(), props.rowKey)}
            displayNone={props.displayNone}
            expandableRow={withExpansion() ? expandable() : undefined}
            expanded={expanded()}
            hovered={props.hovered}
            index={props.index}
            level={withExpansion() ? props.level : undefined}
            record={props.record}
            rowExpandable={table.rowExpandable}
            rowKey={props.rowKey}
            selected={isSelected(table.state().rowSelection?.selectedRowKeysSet ?? new Set(), props.rowKey)}
            style={props.style}
            onHover={props.onHover}
            onRow={table.props.onRow}
            onRowClick={table.props.expandRowByClick && expandable() ? props.onRowClick : undefined}
        />
    );
}
