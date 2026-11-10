import { type JSX, type Ref, For, Match, Show, Suspense, Switch, children, createEffect, createMemo, createSignal, createUniqueId, lazy, on, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { omit } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/components/transfer/constants';
import TransferFoundation, { type TransferAdapter } from '@fibrae/semi-foundation/components/transfer/foundation';
import { formatLocale } from '@fibrae/semi-foundation/locale/format';
import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/components/transfer/transfer.scss';
import { IconClose, IconHandle, IconSearch } from '@fibrae/semi-icons-solid';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import type { SortableHandle } from '../../internal/sortable/types';
import VirtualList from '../../internal/virtual-list';
import callHandler from '../../utils/call-handler';
import hasContent from '../../utils/has-content';
import mergeRefs from '../../utils/merge-refs';
import mergeStyles from '../../utils/merge-styles';
import Button from '../button';
import Checkbox from '../checkbox';
import Input, { type InputProps } from '../input';
import useLocale from '../locale/use-locale';
import Pagination from '../pagination';
import Spin from '../spin';
import { useSpecialTrigger } from '../tooltip/context';
import Tree, { type TreeHandle, type TreeNodeData, type TreeProps } from '../tree';
import AutoSizer from '../tree/auto-sizer';
import {
    type DataItem,
    type RenderSelectedItemProps,
    type ResolvedDataItem,
    type SelectedHeaderProps,
    type SelectedPanelProps,
    type SourceHeaderProps,
    type SourcePanelProps,
    TRANSFER_OWNED_INPUT_PROPS,
    TRANSFER_OWNED_TREE_PROPS,
    type TransferHandle,
    type TransferProps,
    type TransferState,
    type Type,
} from './interface';

// dnd-kit is only needed once a draggable Transfer has a selection
const Sortable = lazy(() => import('../../internal/sortable').then((module) => ({ default: module.Sortable })));

type BlurEvent = Parameters<NonNullable<TransferProps['onBlur']>>[0];
type Foundation = TransferFoundation<TransferProps, BlurEvent>;
type Adapter = TransferAdapter<TransferProps, BlurEvent>;

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
        (view) => TransferFoundation.getInitialState(view),
        () => ({
            notifyBlur: (e) => local.onBlur?.(e),
            notifyChange: (values, items) => local.onChange?.(values, items as DataItem[]),
            notifySearch: (input) => local.onSearch?.(input),
            notifySelect: (item) => local.onSelect?.(item as DataItem),
            notifyDeselect: (item) => local.onDeselect?.(item as DataItem),
            searchTree: (keyword) => treeHandle()?.search(keyword),
            notifyPageChange: (currentPage) => local.pagination?.onPageChange?.(currentPage),
        })
    );

    // memoized so a search keeps the item objects, and with them the rows <For> keys by
    const data = createMemo(() => TransferFoundation.getData(local.dataSource, local.type) as ResolvedDataItem[]);
    const view = createMemo(() => TransferFoundation.deriveView<ResolvedDataItem>(props, state(), data()));
    const isTree = createMemo(() => local.type === strings.TYPE_TREE_TO_LIST);
    const emptyContent = createMemo(() => local.emptyContent ?? {});

    // the group indexes are stable across search and paging, so a group row keeps its DOM
    const groupIndexes = createMemo(() => view().groups.map((group) => group.index));
    const treeRest = createMemo(() => omit((local.treeProps ?? {}) as TreeProps, TRANSFER_OWNED_TREE_PROPS));
    const inputRest = createMemo(() => omit((local.inputProps ?? {}) as InputProps, TRANSFER_OWNED_INPUT_PROPS));

    const selectedItems = () => view().selectedItems;

    const selectedList = createMemo(() => [...selectedItems().values()]);

    const sourcePanelProps: SourcePanelProps = {
        get value() {
            return view().values;
        },
        get loading() {
            return local.loading;
        },
        get noMatch() {
            return view().noMatch;
        },
        get filterData() {
            return view().filterData;
        },
        get sourceData() {
            return data();
        },
        get propsDataSource() {
            return local.dataSource;
        },
        get allChecked() {
            return view().allChecked;
        },
        get showNumber() {
            return view().showNumber;
        },
        get inputValue() {
            return state().inputValue;
        },
        get selectedItems() {
            return selectedItems();
        },
        onSelect: foundation.handleSelect,
        onAllClick: () => foundation.handleAll(!view().allChecked),
        onSearch: (input) => foundation.handleInputChange(input, true),
        onSelectOrRemove: foundation.handleSelectOrRemove,
    };

    const sourceHeaderProps: SourceHeaderProps = {
        get num() {
            return view().showNumber;
        },
        get showButton() {
            return view().showAllButton;
        },
        get allChecked() {
            return view().allChecked;
        },
        onAllClick: sourcePanelProps.onAllClick,
        get leafOnlyNum() {
            return view().leafOnlyNum;
        },
    };

    const selectedPanelProps: SelectedPanelProps = {
        get length() {
            return selectedList().length;
        },
        get selectedData() {
            return view().selectedData;
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
            return view().showClearButton;
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
            fallback={<Header side="left" total={formatLocale(locale().locale.total, { total: view().showNumber })} action={view().allChecked ? locale().locale.clearSelectAll : locale().locale.selectAll} showButton={sourceHeaderProps.showButton} onClick={sourceHeaderProps.onAllClick} />}
        >
            {(render) => render(sourceHeaderProps)}
        </Show>
    );

    const SelectedHeader = () => (
        <Show keyed when={local.renderSelectedHeader} fallback={<Header side="right" total={formatLocale(locale().locale.selected, { total: selectedList().length })} action={locale().locale.clear} showButton={selectedHeaderProps.showButton} onClick={selectedHeaderProps.onClear} />}>
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
            <Show when={local.type === strings.TYPE_GROUP_LIST} fallback={<For each={view().visibleData}>{(item, index) => <SourceItem item={item} index={index()} />}</For>}>
                <For each={groupIndexes()}>
                    {(groupIndex) => {
                        const group = () => view().groups.find((candidate) => candidate.index === groupIndex);
                        const titleId = `${idPrefix}-group-${groupIndex}`;
                        return (
                            <div role="listitem">
                                <div id={titleId} class={`${prefixCls}-group-title`}>
                                    {group()?.title}
                                </div>
                                <div aria-labelledby={titleId} role="list">
                                    <For each={group()?.items.map(({ item }) => item)}>{(item) => <SourceItem item={item} index={view().visibleData.indexOf(item)} />}</For>
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
            value={view().values}
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
            <Match when={view().noMatch}>
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
                <Show when={local.pagination && view().totalPage > 1}>
                    <div class={`${prefixCls}-left-pagination`}>
                        <Pagination currentPage={view().currentPage} pageSize={view().pageSize} total={view().filterData.length} onPageChange={foundation.handlePageChange} />
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
                            <Input tabIndex={local.tabIndex} disabled={local.disabled} placeholder={locale().locale.placeholder} value={state().inputValue} addonAfter={null} addonBefore={null} insetLabel={null} showClear prefix={<IconSearch />} suffix={null} onChange={sourcePanelProps.onSearch} {...inputRest()} />
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
                        {TransferFoundation.generatePath(itemProps.item)}
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

    createEffect(
        on(treeHandle, (handle) => {
            if (handle) {
                foundation.handleTreeMount();
            }
        })
    );

    return (
        <div
            {...rest}
            ref={mergeRefs<HTMLDivElement>(setRoot, local.ref as Ref<HTMLDivElement> | undefined)}
            role={namedRole(rest)}
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
