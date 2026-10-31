import { type JSX, type Ref, For, Match, Show, Suspense, Switch, children, createEffect, createMemo, createSignal, createUniqueId, lazy, on, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/transfer/constants';
import TransferFoundation, { type TransferAdapter } from '@fibrae/semi-foundation/transfer/foundation';
import '@fibrae/semi-foundation/transfer/transfer.scss';
import { IconClose, IconHandle, IconSearch } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import mergeStyles from '../_base/merge-styles';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import VirtualList from '../_base/virtual-list';
import type { SortableHandle } from '../_sortable/types';
import Button from '../button';
import Checkbox from '../checkbox';
import Input from '../input';
import useLocale from '../locale/use-locale';
import Pagination from '../pagination';
import Spin from '../spin';
import { useSpecialTrigger } from '../tooltip/context';
import Tree, { type TreeHandle, type TreeNodeData, type TreeProps } from '../tree';
import AutoSizer from '../tree/auto-sizer';
import { type DataItem, type RenderSelectedItemProps, type ResolvedDataItem, type SelectedHeaderProps, type SelectedPanelProps, type SourceHeaderProps, type SourcePanelProps, TRANSFER_OWNED_TREE_PROPS, type TransferHandle, type TransferProps, type TransferState, type Type } from './interface';

// dnd-kit is only needed once a draggable Transfer has a selection
const Sortable = lazy(() => import('../_sortable').then((module) => ({ default: module.Sortable })));

type BlurEvent = Parameters<NonNullable<TransferProps['onBlur']>>[0];
type Foundation = TransferFoundation<TransferProps, TransferState, BlurEvent>;
type Adapter = TransferAdapter<TransferProps, TransferState, BlurEvent>;
type ItemKey = string | number;

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    type: strings.TYPE_LIST as Type,
    dataSource: [],
    defaultValue: [],
    emptyContent: {},
    showPath: false,
} satisfies Partial<TransferProps>;

// stand-in handle, marked aria-disabled, while the sortable list loads or the transfer is disabled
const staticHandle: SortableHandle = (WrapperComponent) => WrapperComponent;

export default function Transfer(rawProps: TransferProps) {
    const props = useDefaultProps('Transfer', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'class',
        'style',
        'ref',
        'disabled',
        'dataSource',
        'filter',
        'defaultValue',
        'value',
        'inputProps',
        'type',
        'emptyContent',
        'draggable',
        'treeProps',
        'showPath',
        'loading',
        'virtualize',
        'pagination',
        'onChange',
        'onSelect',
        'onDeselect',
        'onSearch',
        'onBlur',
        'onFocusOut',
        'renderLabel',
        'renderSourceItem',
        'renderSelectedItem',
        'renderSourcePanel',
        'renderSelectedPanel',
        'renderSourceHeader',
        'renderSelectedHeader',
        // the root is not a focus target: a tabIndex (one injected by a wrapping Tooltip included) goes to the search box
        'tabIndex',
        // role="group" does not support aria-required
        'aria-required',
    ]);

    const locale = useLocale('Transfer');

    const [treeHandle, setTreeHandle] = createSignal<TreeHandle>();

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const idPrefix = createUniqueId();

    const { foundation, state } = useFoundation<Foundation, Adapter, TransferProps, TransferState>(
        TransferFoundation,
        props,
        // the starting values only: later selections and pages live in the state
        (view) => ({
            selectedValues: view.defaultValue ?? [],
            inputValue: '',
            leftCurrentPage: view.pagination?.defaultCurrentPage ?? view.pagination?.currentPage ?? 1,
        }),
        (base) => ({
            updateSelected: (selectedValues) => base.setState({ selectedValues }),
            notifyBlur: (e) => local.onBlur?.(e),
            notifyChange: (values, items) => local.onChange?.(values, items as DataItem[]),
            notifySearch: (input) => local.onSearch?.(input),
            notifySelect: (item) => local.onSelect?.(item as DataItem),
            notifyDeselect: (item) => local.onDeselect?.(item as DataItem),
            updateInput: (inputValue) => base.setState({ inputValue }),
            searchTree: (keyword) => treeHandle()?.search(keyword),
            updateCurrentPage: (leftCurrentPage) => base.setState({ leftCurrentPage }),
            notifyPageChange: (currentPage) => local.pagination?.onPageChange?.(currentPage),
        })
    );

    // memoized so a search keeps the item objects, and with them the rows <For> keys by
    const data = createMemo(() => TransferFoundation.getData(local.dataSource, local.type) as ResolvedDataItem[]);
    const selectedItems = createMemo(() => TransferFoundation.getSelectedItems(local.value, data(), state().selectedValues) as Map<ItemKey, ResolvedDataItem>);
    const selectedList = createMemo(() => [...selectedItems().values()]);
    const selectedData = createMemo(() => selectedList().map((item) => ({ ...item, fullPath: TransferFoundation.getFullPath(item, local.type, local.showPath) })));
    const values = createMemo(() => TransferFoundation.getValuesAndItemsFromMap(selectedItems(), local.type, local.showPath).values);
    const isTree = createMemo(() => local.type === strings.TYPE_TREE_TO_LIST);
    const searchResult = createMemo(() => (state().inputValue === '' ? null : TransferFoundation.getSearchResult(data(), state().inputValue, local.filter ?? true, local.type)));
    const filterData = createMemo(() => TransferFoundation.getFilterData(data(), searchResult()));
    const enabledFilterData = createMemo(() => TransferFoundation.getEnabledItems(filterData(), local.type));
    const leftContainsNotInSelected = createMemo(() => enabledFilterData().some((item) => !selectedItems().has(item.key)));
    const emptyContent = createMemo(() => local.emptyContent ?? {});
    const pageSize = createMemo(() => TransferFoundation.getPageSize(local.pagination));
    const totalPage = createMemo(() => TransferFoundation.getTotalPage(local.pagination, filterData().length));
    const currentPage = createMemo(() => TransferFoundation.getCurrentPage(local.pagination, state().leftCurrentPage, filterData().length));

    const visibleData = createMemo(() => {
        if (!local.pagination) {
            return filterData();
        }
        const start = (currentPage() - 1) * pageSize();
        return filterData().slice(start, start + pageSize());
    });

    const groupIndexes = createMemo(() => TransferFoundation.getGroupIndexes(data()));

    // the group objects of the shown items: stable across search and paging, so a group row keeps its DOM
    const visibleGroups = createMemo(() => {
        const shown = new Set(visibleData().map((item) => item._parent));
        return [...groupIndexes().keys()].filter((group) => shown.has(group));
    });

    const treeRest = createMemo(() => omit((local.treeProps ?? {}) as TreeProps, TRANSFER_OWNED_TREE_PROPS));
    const noMatch = createMemo(() => searchResult()?.size === 0);
    const showNumber = createMemo(() => searchResult()?.size ?? data().length);

    // the live arguments of the render props; the built-in panels call the same handlers
    const sourcePanelProps: SourcePanelProps = {
        get value() {
            return values();
        },
        get loading() {
            return local.loading;
        },
        get noMatch() {
            return noMatch();
        },
        get filterData() {
            return filterData();
        },
        get sourceData() {
            return data();
        },
        get propsDataSource() {
            return local.dataSource;
        },
        get allChecked() {
            return !leftContainsNotInSelected();
        },
        get showNumber() {
            return showNumber();
        },
        get inputValue() {
            return state().inputValue;
        },
        get selectedItems() {
            return selectedItems();
        },
        onSelect: foundation.handleSelect,
        onAllClick: () => foundation.handleAll(leftContainsNotInSelected()),
        onSearch: (input) => foundation.handleInputChange(input, true),
        onSelectOrRemove: foundation.handleSelectOrRemove,
    };

    const sourceHeaderProps: SourceHeaderProps = {
        get num() {
            return showNumber();
        },
        get showButton() {
            return !isTree() && enabledFilterData().length > 0;
        },
        get allChecked() {
            return !leftContainsNotInSelected();
        },
        onAllClick: sourcePanelProps.onAllClick,
        get leafOnlyNum() {
            return TransferFoundation.getLeafCount(filterData(), local.type);
        },
    };

    const selectedPanelProps: SelectedPanelProps = {
        get length() {
            return selectedList().length;
        },
        get selectedData() {
            return selectedData();
        },
        onClear: foundation.handleClear,
        onRemove: sourcePanelProps.onSelectOrRemove,
        onSortEnd: foundation.handleSortEnd,
    };

    const selectedHeaderProps: SelectedHeaderProps = {
        get num() {
            return selectedList().length;
        },
        get showButton() {
            return selectedList().some((item) => !item.disabled);
        },
        onClear: selectedPanelProps.onClear,
    };

    const treeStyle = () => mergeStyles({ flex: '1', overflow: 'auto' }, local.treeProps?.style);

    // the Tree unmounts while loading or empty: its handle goes with it, and the next one gets the keyword typed meanwhile
    const attachTree = (handle: TreeHandle) => {
        setTreeHandle(handle);
        onCleanup(() => setTreeHandle(undefined));
    };

    const setRoot = (node: HTMLDivElement) => {
        // React's handle method rides on the element: a Tooltip wrapping the Transfer needs the element itself as its ref
        Object.assign(node, { search: (value: string) => foundation.handleInputChange(value, false) } satisfies TransferHandle);
        registerTrigger(node);
    };

    /** null hides the empty state; other empty values fall back to the locale text */
    const Empty = (emptyProps: { side: 'left' | 'right'; content: JSX.Element; fallback: string }) => {
        const content = children(() => emptyProps.content);
        return (
            <Show when={content() !== null}>
                <div class={clsx(`${prefixCls}-empty`, `${prefixCls}-${emptyProps.side}-empty`)}>{hasContent(content()) ? content() : emptyProps.fallback}</div>
            </Show>
        );
    };

    const Header = (headerProps: { side: 'left' | 'right'; total: string; action: string; showButton: boolean; onClick: () => void }) => (
        <div class={clsx(`${prefixCls}-header`, `${prefixCls}-${headerProps.side}-header`)}>
            <span class={`${prefixCls}-header-total`}>{headerProps.total}</span>
            <Show when={headerProps.showButton}>
                <Button type="tertiary" class={`${prefixCls}-header-all`} disabled={local.disabled} size="small" theme="borderless" onClick={() => headerProps.onClick()}>
                    {headerProps.action}
                </Button>
            </Show>
        </div>
    );

    const SourceHeader = () => (
        <Show
            keyed
            when={local.renderSourceHeader}
            fallback={<Header side="left" total={locale().locale.total.replace('${total}', String(showNumber()))} action={leftContainsNotInSelected() ? locale().locale.selectAll : locale().locale.clearSelectAll} showButton={sourceHeaderProps.showButton} onClick={sourceHeaderProps.onAllClick} />}
        >
            {(render) => render(sourceHeaderProps)}
        </Show>
    );

    const SelectedHeader = () => (
        <Show keyed when={local.renderSelectedHeader} fallback={<Header side="right" total={locale().locale.selected.replace('${total}', String(selectedList().length))} action={locale().locale.clear} showButton={selectedHeaderProps.showButton} onClick={selectedHeaderProps.onClear} />}>
            {(render) => render(selectedHeaderProps)}
        </Show>
    );

    const Label = (labelProps: { item: DataItem }) => (
        <Show keyed when={local.renderLabel} fallback={labelProps.item.label}>
            {(render) => render(labelProps.item)}
        </Show>
    );

    const SourceItem = (itemProps: { item: ResolvedDataItem; index: number }) => {
        const checked = () => selectedItems().has(itemProps.item.key);
        return (
            <Show
                keyed
                when={local.renderSourceItem}
                fallback={
                    <Checkbox
                        class={clsx(`${prefixCls}-item`, { [`${prefixCls}-item-disabled`]: itemProps.item.disabled })}
                        role="listitem"
                        checked={checked()}
                        disabled={itemProps.item.disabled || local.disabled}
                        x-semi-children-alias={`dataSource[${itemProps.index}].label`}
                        onChange={() => sourcePanelProps.onSelectOrRemove(itemProps.item)}
                    >
                        <Label item={itemProps.item} />
                    </Checkbox>
                }
            >
                {(render) => (
                    <div role="listitem">
                        {render({
                            ...itemProps.item,
                            get checked() {
                                return checked();
                            },
                            onChange: () => sourcePanelProps.onSelectOrRemove(itemProps.item),
                        })}
                    </div>
                )}
            </Show>
        );
    };

    const SourceList = () => (
        <div
            class={`${prefixCls}-left-list`}
            aria-label={locale().locale.optionList}
            role="list"
            // disabled checkboxes leave nothing focusable, so the list takes the Tab stop to stay scrollable
            tabIndex={local.disabled ? 0 : undefined}
        >
            <Show when={local.type === strings.TYPE_GROUP_LIST} fallback={<For each={visibleData()}>{(item, index) => <SourceItem item={item} index={index()} />}</For>}>
                <For each={visibleGroups()}>
                    {(group) => {
                        // the group's position among all groups, which search and paging leave unchanged
                        const titleId = () => `${idPrefix}-group-${groupIndexes().get(group)}`;
                        return (
                            <div role="listitem">
                                <div id={titleId()} class={`${prefixCls}-group-title`}>
                                    {group?.title}
                                </div>
                                <div aria-labelledby={titleId()} role="list">
                                    <For each={visibleData().filter((item) => item._parent === group)}>{(item) => <SourceItem item={item} index={visibleData().indexOf(item)} />}</For>
                                </div>
                            </div>
                        );
                    }}
                </For>
            </Show>
        </div>
    );

    const SourceTree = () => (
        <Tree
            ref={attachTree}
            aria-label={locale().locale.optionList}
            disabled={local.disabled}
            multiple
            value={values()}
            defaultExpandAll
            disableStrictly
            filterTreeNode
            leafOnly
            treeData={local.dataSource as TreeNodeData[]}
            searchRender={false}
            renderLabel={local.renderLabel ? (_label, node) => local.renderLabel?.(node as DataItem) : undefined}
            onChange={foundation.handleSelect}
            {...treeRest()}
            style={treeStyle()}
        />
    );

    const SourceContent = () => (
        <Switch>
            <Match when={local.loading}>
                <Spin />
            </Match>
            <Match when={noMatch()}>
                <Empty side="left" content={emptyContent().search} fallback={locale().locale.emptySearch} />
            </Match>
            <Match when={data().length === 0}>
                <Empty side="left" content={emptyContent().left} fallback={locale().locale.emptyLeft} />
            </Match>
            <Match when={isTree()}>
                <SourceHeader />
                <SourceTree />
            </Match>
            <Match when={local.type === strings.TYPE_LIST || local.type === strings.TYPE_GROUP_LIST}>
                <SourceHeader />
                <SourceList />
                <Show when={local.pagination && totalPage() > 1}>
                    <div class={`${prefixCls}-left-pagination`}>
                        <Pagination currentPage={currentPage()} pageSize={pageSize()} total={filterData().length} onPageChange={foundation.handlePageChange} />
                    </div>
                </Show>
            </Match>
        </Switch>
    );

    const SourcePanel = () => (
        <Show
            keyed
            when={local.renderSourcePanel}
            fallback={
                <section class={`${prefixCls}-left`}>
                    <Show when={local.filter !== false}>
                        <search class={`${prefixCls}-filter`} aria-label={locale().locale.filter}>
                            <Input tabIndex={local.tabIndex} disabled={local.disabled} placeholder={locale().locale.placeholder} value={state().inputValue} addonAfter={null} addonBefore={null} insetLabel={null} showClear prefix={<IconSearch />} suffix={null} onChange={sourcePanelProps.onSearch} {...local.inputProps} />
                        </search>
                    </Show>
                    <SourceContent />
                </section>
            }
        >
            {(render) => render(sourcePanelProps)}
        </Show>
    );

    const SelectedItem = (itemProps: { item: ResolvedDataItem; sortableHandle?: SortableHandle }) => {
        // a list keeps its handle for as long as it lives: Sortable gives one to every item, the plain lists none or the stand-in
        const sortableHandle = untrack(() => itemProps.sortableHandle);
        const isStatic = sortableHandle === staticHandle;
        const DragHandle = untrack(() => local.draggable) && sortableHandle ? sortableHandle(() => <IconHandle class={`${prefixCls}-right-item-drag-handler`} {...(isStatic ? { 'aria-label': locale().locale.dragSort, role: 'button', 'aria-disabled': 'true' } : {})} />) : undefined;
        const onRemove = () => selectedPanelProps.onRemove(itemProps.item);

        const defaultItem = () => (
            <div class={clsx(`${prefixCls}-item`, `${prefixCls}-right-item`, { [`${prefixCls}-right-item-draggable`]: local.draggable })} role="listitem">
                {DragHandle && <DragHandle />}
                <div class={`${prefixCls}-right-item-text`}>
                    <Show when={isTree() && local.showPath} fallback={<Label item={itemProps.item} />}>
                        {itemProps.item._path?.map((pathItem) => pathItem.label).join(' > ')}
                    </Show>
                </div>
                <button type="button" class={clsx(`${prefixCls}-item-close-icon`, { [`${prefixCls}-item-close-icon-disabled`]: itemProps.item.disabled })} aria-label={locale().locale.remove} disabled={itemProps.item.disabled || local.disabled} onClick={onRemove}>
                    <IconClose />
                </button>
            </div>
        );

        return (
            <Show keyed when={local.renderSelectedItem} fallback={defaultItem()}>
                {(render) => (
                    <div role="listitem">
                        {render({
                            ...itemProps.item,
                            get fullPath() {
                                return TransferFoundation.getFullPath(itemProps.item, local.type, local.showPath);
                            },
                            onRemove,
                            sortableHandle,
                        } satisfies RenderSelectedItemProps)}
                    </div>
                )}
            </Show>
        );
    };

    const SelectedListOuter = (outerProps: JSX.HTMLAttributes<HTMLDivElement>) => (
        // disabled buttons leave nothing focusable, so the list itself takes the Tab stop to stay scrollable
        <div {...outerProps} aria-label={locale().locale.selectedList} role="list" tabIndex={local.disabled ? 0 : undefined} />
    );

    const SelectedList = (listProps: { sortableHandle?: SortableHandle }) => (
        <div class={`${prefixCls}-right-list`} aria-label={locale().locale.selectedList} role="list" tabIndex={local.disabled ? 0 : undefined}>
            <For each={selectedList()}>{(item) => <SelectedItem item={item} sortableHandle={listProps.sortableHandle} />}</For>
        </div>
    );

    const SelectedVirtualList = (listProps: { height: number; width?: number | string }) => (
        <VirtualList
            class={`${prefixCls}-right-list ${prefixCls}-right-virtual-list`}
            height={listProps.height}
            width={listProps.width ?? '100%'}
            itemCount={selectedList().length}
            itemSize={local.virtualize?.itemSize ?? 0}
            itemData={selectedList()}
            itemKey={(index, list) => list[index]?.key ?? index}
            outerElementType={SelectedListOuter}
        >
            {(row) => (
                <div style={row.style} role="presentation">
                    {/* keyed: an item replaced by the dataSource under the same key renders anew */}
                    <Show keyed when={row.data[row.index]}>
                        {(item) => <SelectedItem item={item} />}
                    </Show>
                </div>
            )}
        </VirtualList>
    );

    const SelectedVirtual = () => (
        <Show
            when={typeof local.virtualize?.height === 'number'}
            fallback={
                <div style={{ 'flex-grow': 1, 'min-height': 0 }}>
                    <AutoSizer defaultHeight={local.virtualize?.height} defaultWidth={local.virtualize?.width}>
                        {(size) => <SelectedVirtualList height={size.height} width={size.width} />}
                    </AutoSizer>
                </div>
            }
        >
            <SelectedVirtualList height={local.virtualize?.height as number} width={local.virtualize?.width} />
        </Show>
    );

    const SelectedSortable = () => (
        <Suspense fallback={<SelectedList sortableHandle={staticHandle} />}>
            <Sortable
                container={(containerProps) => <SelectedListOuter style={{ overflow: 'auto' }}>{containerProps.children}</SelectedListOuter>}
                dragHandleLabel={locale().locale.dragSort}
                dragOverlayCls={`${prefixCls}-right-item-drag-item-move`}
                items={selectedList().map((item) => item.key)}
                prefix={`${prefixCls}-right-item`}
                renderItem={(entry) => (
                    // keyed: an item replaced by the dataSource under the same key renders anew
                    <Show keyed when={selectedItems().get(entry.id)}>
                        {(item) => <SelectedItem item={item} sortableHandle={entry.sortableHandle} />}
                    </Show>
                )}
                onSortEnd={selectedPanelProps.onSortEnd}
            />
        </Suspense>
    );

    const SelectedPanel = () => (
        <Show
            keyed
            when={local.renderSelectedPanel}
            fallback={
                <section class={`${prefixCls}-right`}>
                    <SelectedHeader />
                    <Switch fallback={<SelectedList />}>
                        <Match when={selectedList().length === 0}>
                            <Empty side="right" content={emptyContent().right} fallback={locale().locale.emptyRight} />
                        </Match>
                        <Match when={local.draggable && local.disabled}>
                            <SelectedList sortableHandle={staticHandle} />
                        </Match>
                        <Match when={local.draggable}>
                            <SelectedSortable />
                        </Match>
                        <Match when={local.virtualize && Object.keys(local.virtualize).length > 0}>
                            <SelectedVirtual />
                        </Match>
                    </Switch>
                </section>
            }
        >
            {(render) => render(selectedPanelProps)}
        </Show>
    );

    useWatch(
        () => local.value,
        (next, previous) => {
            if (Array.isArray(previous) && !Array.isArray(next)) {
                foundation.handleValueRelease();
            }
        }
    );

    createEffect(
        on(treeHandle, (handle) => {
            const keyword = foundation.getState('inputValue');
            if (handle && keyword) {
                handle.search(keyword);
            }
        })
    );

    return (
        <div
            {...rest}
            ref={mergeRefs<HTMLDivElement>(setRoot, local.ref as Ref<HTMLDivElement> | undefined)}
            role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']}
            class={clsx(prefixCls, local.class, {
                [`${prefixCls}-disabled`]: local.disabled,
                [`${prefixCls}-custom-panel`]: local.renderSelectedPanel && local.renderSourcePanel,
            })}
            style={local.style}
            onFocusOut={(e) => {
                callHandler(local.onFocusOut, e);
                foundation.handleFocusOut(e);
            }}
        >
            <SourcePanel />
            <SelectedPanel />
        </div>
    );
}
