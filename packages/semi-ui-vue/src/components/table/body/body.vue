<script setup lang="ts">
    import { computed, shallowRef, useTemplateRef, watch, type StyleValue } from 'vue';
    import { numbers } from '@fibrae/semi-foundation/components/table/constants';
    import type { BaseRowKeyType } from '@fibrae/semi-foundation/components/table/foundation';
    import {
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
        type ExpandBtnShouldInRowProps,
        type FlattenData,
        type GroupFlattenData,
    } from '@fibrae/semi-foundation/components/table/utils';
    import { toCssLength, warning } from '@fibrae/semi-foundation/utils';
    import { useEventListener, useRaf, useResizeObserver } from '../../../composables/index';
    import { VirtualList, type VirtualListAlign, type VirtualListScrollArgs } from '../../../internal/index';
    import useLocale from '../../locale/use-locale';
    import ColGroup from '../col-group.vue';
    import { useTableContext } from '../context';
    import type { ColumnProps } from '../interface';
    import TableHeader from '../table-header/table-header.vue';
    import { toElement } from '../utils';
    import BaseRow from './base-row.vue';
    import ExpandedRow from './expanded-row.vue';
    import SectionRow from './section-row.vue';

    type AnyRecord = Record<string, any>;

    const props = defineProps<{
        columns: ColumnProps[];
        dataSource: AnyRecord[];
        groups?: Map<BaseRowKeyType, Set<BaseRowKeyType>> | null;
        expandedRowKeys: BaseRowKeyType[];
        pageDisabledRowKeysSet: Set<BaseRowKeyType>;
        virtualizedData: (FlattenData | GroupFlattenData)[];
        includeHeader: boolean;
        tableAttrs?: Record<string, unknown>;
    }>();

    const emit = defineEmits<{ scroll: [args: VirtualListScrollArgs] }>();
    defineSlots<{ empty?(): unknown }>();

    const table = useTableContext();
    const locale = useLocale('Table');

    const bodyRef = useTemplateRef('body');

    // <component :is> renders the configured body table, a component or a tag, so vue-tsc cannot infer the ref.
    const tableRef = useTemplateRef<unknown>('bodyTable');

    // whether the body overflows, so it takes keyboard focus to scroll; known after mount
    const overflows = shallowRef(false);

    // A function ref, not a string ref: under the one-item v-for Vue collects a string ref into an array and pushes into
    // it in place when the list remounts (virtualized off and on), so the watch sources below would never see the new list
    const listRef = shallowRef<InstanceType<typeof VirtualList> | null>(null);

    // function ref: the header sits under the one-item v-for below, which collects a string ref into an array
    const listHeaderElement = shallowRef<HTMLElement | null>(null);
    const listHeaderHeight = shallowRef(0);
    const hoveredRowKey = shallowRef<BaseRowKeyType | null>(null);
    const highlighted = shallowRef<Set<string>>(new Set());

    // itemSize runs for every row on each measure; one warning is enough
    let itemSizeWarned = false;

    // a separate header reserves the width of a vertical scrollbar the body shows (#1219); any header re-measures the
    // fixed-column offsets once the scrollbar narrows the columns
    const scheduleFrame = useRaf();

    const expandBtnInRow = computed(() => {
        const { hasExpandedRow, hideExpandedColumn, childrenRecordName } = table.view.value;
        return expandBtnShouldInRow({
            // the foundation only tests whether it is a function; the content comes from the #expandedRow slot
            expandedRowRender: (hasExpandedRow ? () => null : undefined) as ExpandBtnShouldInRowProps['expandedRowRender'],
            dataSource: props.dataSource,
            hideExpandedColumn,
            childrenRecordName,
            rowExpandable: (record) => table.rowExpandable(record ?? {}),
        });
    });

    const recordsByKey = computed(() => (props.groups instanceof Map ? buildRecordsByKey(props.dataSource, table.rowState.value.rowKey) : new Map<BaseRowKeyType, AnyRecord>()));

    const bodyRows = computed(() => {
        const { childrenRecordName, hasExpandedRow, keepDOM } = table.view.value;
        return flattenBodyRows(
            {
                rowKey: table.rowState.value.rowKey,
                childrenRecordName,
                expandedRowKeys: props.expandedRowKeys,
                hasExpandedRow,
                keepDOM,
                rowExpandable: table.rowExpandable,
            },
            props.dataSource,
            props.groups,
            recordsByKey.value
        );
    });

    // One array for all rows: a new array per render would change every row's props on a hover and re-render them all
    const rowCellWidths = computed(() => table.getCellWidths(table.view.value.flattenedColumns));

    const outerClass = computed(() => {
        const { prefixCls, tableLayout } = table.view.value;
        return [prefixCls, { [`${prefixCls}-fixed`]: tableLayout === 'fixed' }];
    });

    const setList = (instance: unknown) => {
        listRef.value = instance as InstanceType<typeof VirtualList> | null;
    };

    const setListHeader = (element: unknown) => {
        listHeaderElement.value = element as HTMLElement | null;
    };

    const bodyElement = () => bodyRef.value ?? toElement(listRef.value);

    const handleRowHover = (hovered: boolean, rowKey: BaseRowKeyType) => {
        hoveredRowKey.value = hovered ? rowKey : null;
        if (table.view.value.rowSpanHover) {
            highlighted.value = hovered ? getRowSpanHoverKeys(bodyElement(), String(rowKey)) : new Set();
        }
    };

    const groupRecords = (group: Set<BaseRowKeyType>) => [...group].flatMap((key) => recordsByKey.value.get(key) ?? []);

    const baseRowState = (record: AnyRecord, rowKey: BaseRowKeyType, level: number) => {
        const expandable = table.rowExpandable(record);
        const inRow = expandable || expandBtnInRow.value;
        const selectedSet = table.rowState.value.rowSelection?.selectedRowKeysSet;
        return {
            rowKey,
            expanded: isExpanded(props.expandedRowKeys, rowKey),
            expandableRow: inRow ? expandable : undefined,
            level: inRow ? level : undefined,
            clickToExpand: expandable && table.view.value.expandRowByClick,
            selected: selectedSet ? isSelected(selectedSet, rowKey) : false,
            disabled: isDisabled(props.pageDisabledRowKeysSet, rowKey),
            hovered: hoveredRowKey.value === rowKey,
            highlighted: highlighted.value.has(String(rowKey)),
            cellWidths: rowCellWidths.value,
        };
    };

    const recordKey = (record: AnyRecord, index: number) => getRecordKey(record, table.rowState.value.rowKey) ?? index;

    const virtualBody = () => {
        const { scroll, virtualizedProps, size, prefixCls, direction } = table.view.value;
        // the header measures the widths, so it renders before the rows have any
        const cellWidths = table.getCellWidths(props.columns);
        const hasWidths = cellWidths.length > 0;
        const yIsNumber = typeof scroll?.y === 'number';
        const y = yIsNumber ? (scroll?.y as number) : numbers.DEFAULT_VIRTUALIZED_BODY_HEIGHT;
        const rowWidth = hasWidths ? arrayAdd(cellWidths, 0, props.columns.length) : 0;
        const hasRows = props.virtualizedData.length > 0;
        return {
            rowWidth,
            itemCount: hasWidths ? props.virtualizedData.length : 0,
            height: hasRows ? y : 0,
            // null, which StyleValue does not type, removes the list's own height; undefined would remove it too
            style: (hasRows ? { direction } : { direction, height: null }) as StyleValue,
            itemSize: (index: number) => {
                const item = props.virtualizedData[index] as Partial<FlattenData & GroupFlattenData> | undefined;
                const { size: real, minHeight } = resolveVirtualizedItemSize(virtualizedProps?.itemSize, size, index, { expandedRow: Boolean(item?.expandedRow), sectionRow: Boolean(item?.sectionRow) });
                if (real < minHeight && !itemSizeWarned) {
                    itemSizeWarned = true;
                    warning(true, `[Semi Table] The computed real \`itemSize\` cannot be less than ${minHeight}`);
                }
                return real;
            },
            wrapperAttrs: {
                class: [prefixCls, `${prefixCls}-fixed`],
                style: { width: toCssLength(rowWidth) },
                // its display: table would make Chrome expose a layout table between the rows and the container table
                role: 'none',
            },
        };
    };

    const virtualItem = (index: number) => props.virtualizedData[index] as FlattenData & Partial<GroupFlattenData>;

    const virtualKey = (index: number) => {
        const item = virtualItem(index);
        if (!item) {
            return index;
        }
        return `${item.sectionRow ? 'section' : item.expandedRow ? 'expanded' : 'base'}:${item.key}`;
    };

    const measureOverflow = () => {
        const node = bodyRef.value;
        if (node) {
            overflows.value = node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight;
        }
    };

    // a scrolling body must be keyboard reachable even without a focusable cell
    const scrollable = () => Boolean(table.view.value.scroll?.y) || overflows.value;

    // a separate (sticky) header reserves the width of a vertical scrollbar the body shows (#1219)
    useResizeObserver(
        () => (table.view.value.scroll?.y && !props.includeHeader ? bodyElement() : null),
        () =>
            scheduleFrame(() => {
                const node = bodyElement();
                if (node) {
                    table.setBodyHasScrollbar(node.clientWidth < node.offsetWidth);
                }
            })
    );

    useResizeObserver(listHeaderElement, () => {
        listHeaderHeight.value = listHeaderElement.value?.offsetHeight ?? 0;
    });

    // a scroll.y body scrolls anyway; the table is observed too, as new columns or rows can overflow the body without
    // resizing it
    useResizeObserver(() => (table.view.value.scroll?.y ? null : bodyRef.value), measureOverflow);
    useResizeObserver(() => (table.view.value.scroll?.y ? null : toElement(tableRef.value)), measureOverflow);

    // The virtual list's scroll event is the vertical offset only; the horizontal offset syncs the header from the
    // scroll container's own event
    useEventListener(
        () => toElement(listRef.value),
        'scroll',
        (event) => table.handleBodyScroll(event)
    );

    // the list caches row offsets; expanding, sorting or filtering changes which row kind (and size) sits at an index
    // Watch itemSize, not the virtualized object: an inline object is new on every parent render
    watch([() => props.virtualizedData, () => table.view.value.virtualized, () => table.view.value.virtualizedProps?.itemSize, () => table.view.value.size], () => listRef.value?.measure(), { flush: 'post' });

    watch(
        () => table.view.value.virtualized && typeof table.view.value.scroll?.y !== 'number',
        (missing) => warning(missing, '[Semi Table] You have to specific "scroll.y" which must be a number for table virtualization!'),
        { immediate: true }
    );

    defineExpose({
        element: bodyElement,
        scrollTo: (offset: number) => listRef.value?.scrollTo(offset),
        scrollToItem: (index: number, align?: VirtualListAlign) => listRef.value?.scrollToItem(index, align),
        hasList: () => listRef.value != null,
    });
</script>

<template>
    <template v-if="table.view.value.virtualized">
        <template v-for="(list, listIndex) in [virtualBody()]" :key="listIndex">
            <VirtualList
                :ref="setList"
                :class="`${table.view.value.prefixCls}-body`"
                :height="list.height"
                :innerAttrs="{ class: `${table.view.value.prefixCls}-tbody`, role: 'rowgroup' }"
                :itemCount="list.itemCount"
                :itemKey="virtualKey"
                :itemSize="list.itemSize"
                :overscan="table.view.value.virtualizedProps?.overscanCount"
                :scrollMargin="props.includeHeader ? listHeaderHeight : 0"
                :style="list.style"
                tabindex="0"
                :wrapperAttrs="list.wrapperAttrs"
                @scroll="(...args) => emit('scroll', ...args)"
            >
                <!-- a hidden header stays for its column widths; inert keeps its controls out of the Tab order and the a11y tree -->
                <template v-if="props.includeHeader" #before>
                    <div :ref="setListHeader" :class="`${table.view.value.prefixCls}-list-header`" :inert="!table.view.value.showHeader">
                        <component :is="table.view.value.components.header.outer" :class="[table.view.value.prefixCls, `${table.view.value.prefixCls}-fixed`]" role="none" :style="{ width: toCssLength(table.view.value.scroll?.x), minWidth: toCssLength(getColumnsMinWidth(table.view.value.flattenedColumns)) }">
                            <ColGroup :columns="props.columns" :prefixCls="table.view.value.prefixCls" />
                            <TableHeader :columns="props.columns" :hidden="!table.view.value.showHeader" />
                        </component>
                    </div>
                </template>
                <template #default="{ index, style }">
                    <template v-for="item in [virtualItem(index)]" :key="item.key">
                        <SectionRow v-if="item.sectionRow" :expanded="Boolean(item.expanded)" :group="item.group!" :groupKey="item.groupKey!" :index="index" :records="groupRecords(item.group!)" :style="{ ...style, width: toCssLength(list.rowWidth) }" />
                        <ExpandedRow v-else-if="item.expandedRow" expanded :index="index" :record="item.record" :rowKey="recordKey(item.record, index)" :style="{ ...style, width: toCssLength(list.rowWidth) }" :virtualIndex="index" />
                        <BaseRow v-else v-bind="baseRowState(item.record, recordKey(item.record, index), item.level)" :index="index" :record="item.record" :style="{ ...style, width: toCssLength(list.rowWidth) }" @hoverChange="handleRowHover" />
                    </template>
                </template>
                <template v-if="!props.dataSource.length" #after>
                    <slot name="empty" />
                </template>
            </VirtualList>
        </template>
    </template>
    <!-- overflow is auto rather than scroll: with only scroll.y no horizontal scrollbar shows; a group between the role="table" container and the rows of a split table would break the table -->
    <div
        v-else
        ref="body"
        :aria-label="scrollable() && !table.view.value.splitTable ? locale.locale.scrollRegion : undefined"
        :class="`${table.view.value.prefixCls}-body`"
        :role="scrollable() && !table.view.value.splitTable ? 'group' : undefined"
        :style="{ maxHeight: toCssLength(table.view.value.scroll?.y), overflow: table.view.value.anyColumnFixed && props.dataSource.length ? 'auto' : undefined }"
        :tabindex="scrollable() ? 0 : undefined"
        @mouseleave="highlighted = new Set()"
        @scroll="table.handleBodyScroll"
    >
        <!-- a table, not a grid: the cells have no arrow-key navigation; with a separate header the container is the table -->
        <component :is="table.view.value.components.body.outer" ref="bodyTable" :class="outerClass" :role="table.view.value.splitTable ? 'none' : 'table'" :style="{ width: toCssLength(table.view.value.scroll?.x), minWidth: toCssLength(getColumnsMinWidth(table.view.value.flattenedColumns)) }" v-bind="props.tableAttrs">
            <ColGroup :col="table.view.value.components.body.colgroup.col" :columns="props.columns" :prefixCls="table.view.value.prefixCls" :wrapper="table.view.value.components.body.colgroup.wrapper" />
            <!-- without a header the fixed columns still need its measured widths for their offsets -->
            <TableHeader v-if="props.includeHeader && (table.view.value.showHeader || table.view.value.anyColumnFixed)" :columns="props.columns" :hidden="!table.view.value.showHeader" />
            <!-- under a role="none" table a tbody would be presentational too -->
            <component :is="table.view.value.components.body.wrapper" :class="`${table.view.value.prefixCls}-tbody`" :role="table.view.value.splitTable ? 'rowgroup' : undefined">
                <template v-for="row in bodyRows" :key="`${row.kind}:${row.key}`">
                    <SectionRow v-if="row.kind === 'section'" :expanded="row.expanded" :group="row.group" :groupKey="row.key" :index="row.index" :records="groupRecords(row.group)" />
                    <ExpandedRow v-else-if="row.kind === 'expanded'" :displayNone="row.displayNone" :expanded="row.expanded" :index="row.index" :record="row.record" :rowKey="row.key" />
                    <BaseRow v-else v-bind="baseRowState(row.record, row.key, row.level)" :displayNone="row.displayNone" :index="row.index" :record="row.record" @hoverChange="handleRowHover" />
                </template>
            </component>
        </component>
        <slot v-if="!props.dataSource.length" name="empty" />
    </div>
</template>
