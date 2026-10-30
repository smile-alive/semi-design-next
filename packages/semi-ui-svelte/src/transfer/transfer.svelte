<script lang="ts">
    import { untrack } from 'svelte';
    import { noop, omit } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/transfer/constants';
    import TransferFoundation, { type BasicResolvedDataItem, type TransferAdapter, type TransferBaseProps, type TransferBaseState } from '@fibrae/semi-foundation/transfer/foundation';
    import '@fibrae/semi-foundation/transfer/transfer.scss';
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import VirtualList from '../_base/virtual-list.svelte';
    import watch from '../_base/watch.svelte.js';
    import type SortableComponent from '../_sortable/sortable.svelte';
    import { Button } from '../button/index.js';
    import { Checkbox } from '../checkbox/index.js';
    import { Input } from '../input/index.js';
    import { useLocale } from '../locale/index.js';
    import { Pagination } from '../pagination/index.js';
    import { Spin } from '../spin/index.js';
    import AutoSizer from '../tree/auto-sizer.svelte';
    import { Tree } from '../tree/index.js';
    import type { TreeHandle, TreeNodeData, TreeValue } from '../tree/interface.js';
    import type { TransferDataItem, TransferGroupItem, TransferOnSortEnd, TransferProps, TransferSelectedPanelSnippetProps, TransferSourcePanelSnippetProps, TransferValue } from './interface.js';
    import TransferSelectedItem from './transfer-selected-item.svelte';

    type ResolvedItem = BasicResolvedDataItem & TransferDataItem;

    interface LeftGroup {
        /** The group's position among the non-empty groups of the dataSource, which search and paging keep */
        index: number;
        parent?: Omit<TransferGroupItem, 'children'>;
        items: { item: ResolvedItem; index: number }[];
    }

    type Foundation = TransferFoundation<TransferBaseProps, TransferBaseState>;
    type Adapter = TransferAdapter<TransferBaseProps, TransferBaseState>;

    const defaults = useDefaultProps('Transfer');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        dataSource = defaults('dataSource', []),
        type = defaults('type', 'list'),
        disabled = defaults('disabled', false),
        draggable = defaults('draggable', false),
        loading = defaults('loading'),
        showPath = defaults('showPath', false),
        filter = defaults('filter'),
        inputProps = defaults('inputProps'),
        treeProps = defaults('treeProps'),
        pagination = defaults('pagination'),
        virtualize = defaults('virtualize'),
        onChange,
        onSelect,
        onDeselect,
        onSearch,
        onBlur,
        label,
        sourceItem,
        selectedItem,
        sourceHeader,
        selectedHeader,
        sourcePanel,
        selectedPanel,
        emptyLeft,
        emptyRight,
        emptySearch,
        ...rest
    }: TransferProps = $props();

    const locale = useLocale('Transfer');

    const uid = $props.id();
    let tree = $state<TreeHandle>();

    // loaded on first use, so an app that never drags does not pay for dnd-kit
    let Sortable = $state.raw<typeof SortableComponent>();

    // set by the adapter: a `value` released to undefined drops what the transfer remembered of its own selection
    let clearSelected = noop;

    const prefixCls = cssClasses.PREFIX;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: TransferBaseProps = {
        get value() {
            return value;
        },
        get dataSource() {
            return dataSource;
        },
        get type() {
            return type;
        },
        get disabled() {
            return disabled;
        },
        get filter() {
            return filter;
        },
        get pagination() {
            return pagination;
        },
        get showPath() {
            return showPath;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, TransferBaseProps, TransferBaseState>(
        TransferFoundation,
        foundationProps,
        () => ({
            selectedValues: [],
            inputValue: '',
            leftCurrentPage: pagination?.defaultCurrentPage ?? pagination?.currentPage ?? 1,
        }),
        (base) => {
            clearSelected = () => base.setState({ selectedValues: [] });
            return {
                notifyBlur: (event) => onBlur?.(event),
                updateSelected: (selectedValues) => base.setState({ selectedValues }),
                notifyChange: (values, items) => {
                    // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                    value = values;
                    onChange?.(values, items as TransferDataItem[]);
                },
                notifySearch: (input) => onSearch?.(input),
                notifySelect: (item) => onSelect?.(item as TransferDataItem),
                notifyDeselect: (item) => onDeselect?.(item as TransferDataItem),
                updateInput: (inputValue) => base.setState({ inputValue }),
                searchTree: (keyword) => tree?.search(keyword),
                updateCurrentPage: (leftCurrentPage) => base.setState({ leftCurrentPage }),
                notifyPageChange: (currentPage) => pagination?.onPageChange?.(currentPage),
            };
        }
    );

    const data = $derived(TransferFoundation.getData(dataSource, type) as ResolvedItem[]);
    const selectedItems = $derived(TransferFoundation.getSelectedItems(value, data, states().selectedValues) as Map<string | number, ResolvedItem>);
    const isTree = $derived(type === strings.TYPE_TREE_TO_LIST);
    const isList = $derived(type === strings.TYPE_LIST || type === strings.TYPE_GROUP_LIST);
    const searchResult = $derived(states().inputValue === '' ? null : TransferFoundation.getSearchResult(data, states().inputValue, filter ?? true, type));
    const filterData = $derived(TransferFoundation.getFilterData(data, searchResult));
    const showNumber = $derived(searchResult?.size ?? data.length);
    const noMatch = $derived(searchResult?.size === 0);
    const enabledFilterData = $derived(TransferFoundation.getEnabledItems(filterData, type));
    const leftContainsNotInSelected = $derived(enabledFilterData.some((item) => !selectedItems.has(item.key)));
    const leafOnlyNum = $derived(TransferFoundation.getLeafCount(filterData, type));
    const showAllButton = $derived(!isTree && enabledFilterData.length > 0);
    const values = $derived(TransferFoundation.getValuesAndItemsFromMap(selectedItems, type, showPath).values);
    const pageSize = $derived(TransferFoundation.getPageSize(pagination));
    const totalPage = $derived(TransferFoundation.getTotalPage(pagination, filterData.length));
    const currentPage = $derived(TransferFoundation.getCurrentPage(pagination, states().leftCurrentPage, filterData.length));

    const leftGroups = $derived.by(() => {
        const start = (currentPage - 1) * pageSize;
        const visible = pagination ? filterData.slice(start, start + pageSize) : filterData;
        const groupIndexes = TransferFoundation.getGroupIndexes(data);
        const groups: LeftGroup[] = [];
        visible.forEach((item, index) => {
            const last = groups.at(-1);
            if (last && last.parent === item._parent) {
                last.items.push({ item, index });
            } else {
                groups.push({
                    index: groupIndexes.get(item._parent) ?? 0,
                    parent: item._parent,
                    items: [{ item, index }],
                });
            }
        });
        return groups;
    });

    const selectedData = $derived(
        [...selectedItems.values()].map((item): ResolvedItem => ({
            ...item,
            fullPath: TransferFoundation.getFullPath(item, type, showPath) as TransferDataItem[] | undefined,
        }))
    );

    const selectedKeys = $derived(selectedData.map((item) => item.key));
    const selectedByKey = $derived(new Map(selectedData.map((item) => [item.key, item])));
    const virtualized = $derived(Boolean(virtualize && Object.keys(virtualize).length));
    const virtualHeight = $derived(typeof virtualize?.height === 'number' ? virtualize.height : undefined);
    const showsSortable = $derived(Boolean(draggable && !disabled && Sortable));
    const hasSelectable = $derived(selectedData.some((item) => !item.disabled));

    // Transfer owns the Tree's value, data and handle: a caller's would fight the selection, break the flat item map or
    // replace the search handle. `class` and `style` merge with Transfer's own below.
    const treeBindings = $derived(omit((treeProps ?? {}) as Record<string, unknown>, ['class', 'style', 'value', 'onChange', 'keyMaps', 'treeData', 'treeDataSimpleJson', 'onChangeWithObject', 'search', 'label']));

    // the root is not a focus target: a tabindex (one injected by a wrapping Tooltip included) goes to the search box
    const attrs = $derived(splitControlAttrs(rest, (key) => key === 'tabindex'));

    const onInputChange = (input: string) => {
        foundation.handleInputChange(input, true);
    };

    const onSelectOrRemove = (item: TransferDataItem) => {
        foundation.handleSelectOrRemove(item);
    };

    const onAllClick = () => {
        foundation.handleAll(leftContainsNotInSelected);
    };

    const sourcePanelProps: TransferSourcePanelSnippetProps = $derived({
        value: values,
        loading,
        noMatch,
        filterData,
        sourceData: data,
        propsDataSource: dataSource,
        allChecked: !leftContainsNotInSelected,
        showNumber,
        inputValue: states().inputValue,
        selectedItems,
        onSelect: foundation.handleSelect,
        onAllClick,
        onSearch: onInputChange,
        onSelectOrRemove,
    });

    const onClear = () => {
        foundation.handleClear();
    };

    const onSortEnd = (payload: Parameters<TransferOnSortEnd>[0]) => {
        foundation.handleSortEnd(payload);
    };

    const selectedPanelProps: TransferSelectedPanelSnippetProps = $derived({
        length: selectedData.length,
        selectedData,
        onClear,
        onRemove: onSelectOrRemove,
        onSortEnd,
    });

    const handleFocusOut = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        rest.onfocusout?.(event);
        foundation.handleFocusOut(event);
    };

    const pathLabel = (item: ResolvedItem) => {
        return isTree && showPath ? TransferFoundation.generatePath(item) : undefined;
    };

    const groupTitleId = (index: number) => {
        return `${uid}-group-${index}`;
    };

    const onTreeChange = (next: TreeValue) => {
        foundation.handleSelect(next as TransferValue);
    };

    watch(
        () => value,
        (next) => {
            if (next === undefined) {
                clearSelected();
            }
        }
    );

    $effect(() => {
        if (draggable && !Sortable) {
            void import('../_sortable/sortable.svelte').then((module) => {
                Sortable = module.default;
            });
        }
    });

    // The Tree unmounts while loading or empty, and a keyword typed meanwhile only reached the search box
    $effect(() => {
        const handle = tree;
        const keyword = untrack(() => states().inputValue);
        if (handle && keyword) {
            handle.search(keyword);
        }
    });

    /** Searches as if `input` were typed into the search box; a search through the handle comes from the caller, so `onSearch` does not fire */
    export function search(input: string) {
        foundation.handleInputChange(input, false);
    }
</script>

{#snippet emptyState(content: TransferProps['emptyLeft'], side: 'left' | 'right', text: string)}
    {#if content !== false}
        <div class={[`${prefixCls}-empty`, `${prefixCls}-${side}-empty`]}>
            {#if content}{@render content()}{:else}{text}{/if}
        </div>
    {/if}
{/snippet}

{#snippet itemLabel(item: TransferDataItem)}{#if label}{@render label({ item })}{:else}{item.label}{/if}{/snippet}

{#snippet sourceItems(group: LeftGroup)}
    {#each group.items as { item, index } (item.key)}
        {#if sourceItem}
            <div role="listitem">
                {@render sourceItem({ item, index, checked: selectedItems.has(item.key), onChange: () => onSelectOrRemove(item) })}
            </div>
        {:else}
            <Checkbox bind:checked={() => selectedItems.has(item.key), noop} class={[`${prefixCls}-item`, { [`${prefixCls}-item-disabled`]: item.disabled }]} disabled={item.disabled || disabled} onChange={() => onSelectOrRemove(item)} role="listitem">
                {@render itemLabel(item)}
            </Checkbox>
        {/if}
    {/each}
{/snippet}

{#snippet selectedRow(row: ResolvedItem, index: number, sortable: boolean)}
    <TransferSelectedItem {disabled} {draggable} {index} item={row} {label} onRemove={() => onSelectOrRemove(row)} pathLabel={pathLabel(row)} {selectedItem} {sortable} />
{/snippet}

{#snippet virtualRow({ index, style }: { index: number; style: string })}
    {@const row = selectedData[index]}
    {#if row}
        <div role="presentation" {style}>
            {@render selectedRow(row, index, false)}
        </div>
    {/if}
{/snippet}

<div {...attrs.root} class={[prefixCls, rest.class, { [`${prefixCls}-disabled`]: disabled, [`${prefixCls}-custom-panel`]: sourcePanel && selectedPanel }]} role={groupRole(rest)} onfocusout={handleFocusOut}>
    {#if sourcePanel}
        {@render sourcePanel(sourcePanelProps)}
    {:else}
        <section class={`${prefixCls}-left`}>
            {#if filter !== false}
                <search aria-label={locale().locale.filter} class={`${prefixCls}-filter`}>
                    <Input bind:value={() => states().inputValue, noop} {disabled} placeholder={locale().locale.placeholder} showClear {...attrs.control} {...inputProps} onChange={onInputChange}>
                        {#snippet prefix()}
                            <IconSearch />
                        {/snippet}
                    </Input>
                </search>
            {/if}
            {#if loading}
                <Spin />
            {:else if noMatch}
                {@render emptyState(emptySearch, 'left', locale().locale.emptySearch)}
            {:else if data.length === 0}
                {@render emptyState(emptyLeft, 'left', locale().locale.emptyLeft)}
            {:else if isList || isTree}
                {#if sourceHeader}
                    {@render sourceHeader({ allChecked: !leftContainsNotInSelected, leafOnlyNum, num: showNumber, onAllClick, showButton: showAllButton })}
                {:else}
                    <div class={[`${prefixCls}-header`, `${prefixCls}-left-header`]}>
                        <span class={`${prefixCls}-header-total`}>{locale().locale.total.replace('${total}', String(showNumber))}</span>
                        {#if showAllButton}
                            <Button class={`${prefixCls}-header-all`} {disabled} size="small" theme="borderless" type="tertiary" onclick={onAllClick}>
                                {leftContainsNotInSelected ? locale().locale.selectAll : locale().locale.clearSelectAll}
                            </Button>
                        {/if}
                    </div>
                {/if}
                {#if isTree}
                    {#snippet treeLabel({ item }: { item: TreeNodeData })}
                        {@render itemLabel(item as TransferDataItem)}
                    {/snippet}
                    <Tree
                        aria-label={locale().locale.optionList}
                        bind:this={tree}
                        bind:value={() => values, noop}
                        defaultExpandAll
                        disableStrictly
                        {disabled}
                        filterTreeNode
                        leafOnly
                        multiple
                        search={false}
                        treeData={dataSource as TreeNodeData[]}
                        {...treeBindings}
                        {...label ? { label: treeLabel } : {}}
                        class={treeProps?.class}
                        onChange={onTreeChange}
                        style={['flex: 1; overflow: auto', treeProps?.style].filter(Boolean).join(';')}
                    />
                {:else}
                    <!-- checkboxes are disabled with the transfer, so the keyboard can only scroll the list -->
                    <div aria-label={locale().locale.optionList} class={`${prefixCls}-left-list`} role="list" tabindex={disabled ? 0 : undefined}>
                        {#each leftGroups as group (group.index)}
                            {#if group.parent}
                                <div role="listitem">
                                    <div class={`${prefixCls}-group-title`} id={groupTitleId(group.index)}>
                                        {group.parent.title}
                                    </div>
                                    <div aria-labelledby={groupTitleId(group.index)} role="list">
                                        {@render sourceItems(group)}
                                    </div>
                                </div>
                            {:else}
                                {@render sourceItems(group)}
                            {/if}
                        {/each}
                    </div>
                {/if}
                {#if isList && pagination && totalPage > 1}
                    <div class={`${prefixCls}-left-pagination`}>
                        <Pagination bind:currentPage={() => currentPage, noop} onPageChange={foundation.handlePageChange} {pageSize} total={filterData.length} />
                    </div>
                {/if}
            {/if}
        </section>
    {/if}
    {#if selectedPanel}
        {@render selectedPanel(selectedPanelProps)}
    {:else}
        <section class={`${prefixCls}-right`}>
            {#if selectedHeader}
                {@render selectedHeader({ num: selectedData.length, onClear, showButton: hasSelectable })}
            {:else}
                <div class={[`${prefixCls}-header`, `${prefixCls}-right-header`]}>
                    <span class={`${prefixCls}-header-total`}>{locale().locale.selected.replace('${total}', String(selectedData.length))}</span>
                    {#if hasSelectable}
                        <Button class={`${prefixCls}-header-all`} {disabled} size="small" theme="borderless" type="tertiary" onclick={onClear}>{locale().locale.clear}</Button>
                    {/if}
                </div>
            {/if}
            {#if selectedData.length === 0}
                {@render emptyState(emptyRight, 'right', locale().locale.emptyRight)}
            {:else if showsSortable && Sortable}
                <Sortable aria-label={locale().locale.selectedList} class={`${prefixCls}-right-list`} dragHandleLabel={locale().locale.dragSort} dragOverlayClass={`${prefixCls}-right-item-drag-item-move`} items={selectedKeys} {onSortEnd} prefix={`${prefixCls}-right-item`} role="list" style="overflow: auto">
                    {#snippet item({ id })}
                        <!-- the list shows a preview order while dragging, so the row is found by its key, not by the position -->
                        {@const row = selectedByKey.get(id)}
                        {#if row}
                            {@render selectedRow(row, selectedKeys.indexOf(id), true)}
                        {/if}
                    {/snippet}
                </Sortable>
            {:else if !draggable && virtualized && virtualHeight === undefined}
                <div style="flex-grow: 1; min-height: 0">
                    <AutoSizer defaultHeight={virtualize?.height ?? ''} defaultWidth={virtualize?.width}>
                        {#snippet children({ height, width })}
                            <VirtualList
                                aria-label={locale().locale.selectedList}
                                class={[`${prefixCls}-right-list`, `${prefixCls}-right-virtual-list`]}
                                {height}
                                itemCount={selectedData.length}
                                itemKey={(index) => selectedData[index]?.key ?? index}
                                itemSize={virtualize?.itemSize ?? 0}
                                role="list"
                                tabindex={disabled ? 0 : undefined}
                                {width}
                            >
                                {#snippet children({ index, style })}
                                    {@render virtualRow({ index, style })}
                                {/snippet}
                            </VirtualList>
                        {/snippet}
                    </AutoSizer>
                </div>
            {:else if !draggable && virtualHeight !== undefined}
                <VirtualList
                    aria-label={locale().locale.selectedList}
                    class={[`${prefixCls}-right-list`, `${prefixCls}-right-virtual-list`]}
                    height={virtualHeight}
                    itemCount={selectedData.length}
                    itemKey={(index) => selectedData[index]?.key ?? index}
                    itemSize={virtualize?.itemSize ?? 0}
                    role="list"
                    tabindex={disabled ? 0 : undefined}
                    width={virtualize?.width || '100%'}
                >
                    {#snippet children({ index, style })}
                        {@render virtualRow({ index, style })}
                    {/snippet}
                </VirtualList>
            {:else}
                <!-- a disabled transfer falls through to the plain list, whose drag handles are aria-disabled stand-ins -->
                <div aria-label={locale().locale.selectedList} class={`${prefixCls}-right-list`} role="list" tabindex={disabled ? 0 : undefined}>
                    {#each selectedData as row, index (row.key)}
                        {@render selectedRow(row, index, false)}
                    {/each}
                </div>
            {/if}
        </section>
    {/if}
</div>
