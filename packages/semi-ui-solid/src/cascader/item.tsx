import { type Accessor, type JSX, For, Show, children, createMemo, createRenderEffect, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/cascader/constants';
import CascaderFoundation, { type BasicCascaderData, type BasicData, type BasicEntity, type ShowNextType, type Virtualize } from '@fibrae/semi-foundation/cascader/foundation';
import { getColumns, highlightParts } from '@fibrae/semi-foundation/cascader/util';
import { IconChevronRight, IconTick } from '@fibrae/semi-icons-solid';
import hasContent from '../_base/has-content';
import VirtualList, { type VirtualListHandle } from '../_base/virtual-list';
import Checkbox, { type CheckboxEvent } from '../checkbox';
import useConfig from '../config-provider/use-config';
import useLocale from '../locale/use-locale';
import Spin from '../spin';

/** A node of `treeData`; markup for its label goes through `renderLabel` */
export interface CascaderData extends BasicCascaderData {
    label: string | number;
}

export interface Entity extends BasicEntity {
    children?: Array<Entity>;
    data: CascaderData;
    parent?: Entity;
}

export interface Entities {
    [idx: string]: Entity;
}

export interface Data extends BasicData {
    data: CascaderData;
    searchText: Array<string | number>;
    pathData?: CascaderData[];
}

/** Live like component props: read the fields where they are used */
export interface FilterRenderProps {
    class: string;
    inputValue: string;
    disabled: boolean;
    data: CascaderData[];
    checkStatus: {
        checked: boolean;
        halfChecked: boolean;
    };
    selected: boolean;
    onClick: (e: MouseEvent) => void;
    onCheck: (e: CheckboxEvent) => void;
}

export interface CascaderItemProps {
    activeKeys: Set<string>;
    selectedKeys: Set<string>;
    loadedKeys: Set<string>;
    loadingKeys: Set<string>;
    onItemClick: (e: MouseEvent, item: Entity | Data) => void;
    onItemHover: (e: MouseEvent, item: Entity) => void;
    showNext?: ShowNextType;
    onItemCheckboxClick: (item: Entity | Data) => void;
    onListScroll: (e: Event, ind: number) => void;
    searchable: boolean;
    keyword: string;
    /** `null` hides the empty state */
    emptyContent?: JSX.Element;
    loadData?: (selectOptions: CascaderData[]) => Promise<void>;
    data: Array<Data | Entity>;
    separator?: string;
    multiple: boolean;
    checkedKeys: Set<string>;
    halfCheckedKeys: Set<string>;
    filterRender?: (props: FilterRenderProps) => JSX.Element;
    renderLabel?: (item: CascaderData) => JSX.Element;
    virtualize?: Virtualize;
    expandIcon?: JSX.Element;
    /** id of the tree, or of the listbox of search results; the combobox's aria-controls points at it */
    id: string;
    /** the popup's name, the same as the combobox's */
    labelProps: { 'aria-label'?: string; 'aria-labelledby'?: string };
    /** the option the arrow keys are on, pointed at by the combobox's aria-activedescendant */
    keyboardKey: string | null;
    optionId: (key: string) => string;
    virtualListRef: (handle?: VirtualListHandle) => void;
}

type Column = ReturnType<typeof getColumns<Entity>>[number];

const prefixcls = cssClasses.PREFIX_OPTION;

/** The inner element of the virtual search list: the rows are its `li` children */
function VirtualListInner(props: { style?: JSX.CSSProperties; children?: JSX.Element }) {
    return (
        <ul style={props.style} class={`${prefixcls}-list`} role="none">
            {props.children}
        </ul>
    );
}

export default function Item(props: CascaderItemProps) {
    const config = useConfig();
    const locale = useLocale('Cascader');

    const emptyContent = children(() => props.emptyContent);

    const isEmpty = () => !props.data.length;

    // keyed by the first option, so another branch's column is a new list scrolled to its top
    const columns = createMemo(() => new Map((props.searchable || isEmpty() ? [] : getColumns(props.data as Entity[], props.activeKeys)).map((column) => [column.items[0].key, column])));
    const columnKeys = createMemo(() => [...columns().keys()]);

    const results = () => props.data as Data[];

    const isDisabled = (item: Entity | Data) => Boolean(item.data.disabled || ('disabled' in item && item.disabled));

    const onClick = (e: MouseEvent, item: Entity | Data) => {
        if (!isDisabled(item)) {
            props.onItemClick(e, item);
        }
    };

    const onHover = (e: MouseEvent, item: Entity) => {
        if (!item.data.disabled && props.showNext === strings.SHOW_NEXT_BY_HOVER) {
            props.onItemHover(e, item);
        }
    };

    // the click on the checkbox must not also reach the option as a click
    const onCheckboxChange = (e: CheckboxEvent, item: Entity | Data) => {
        e.stopPropagation();
        props.onItemCheckboxClick(item);
    };

    const renderCheckbox = (item: Accessor<Entity | Data>, disabled: Accessor<boolean | undefined>) => (
        <Checkbox class={`${prefixcls}-label-checkbox`} aria-hidden="true" tabIndex={-1} checked={props.checkedKeys.has(item().key)} disabled={disabled()} indeterminate={props.halfCheckedKeys.has(item().key)} onChange={(e) => onCheckboxChange(e, item())} />
    );

    const ExpandIcon = (iconProps: { loading: boolean }) => {
        const custom = children(() => props.expandIcon);
        return (
            <Show
                when={iconProps.loading}
                fallback={
                    <Show when={hasContent(custom())} fallback={<IconChevronRight class={`${prefixcls}-icon ${prefixcls}-icon-expand ${prefixcls}-icon-left`} />}>
                        {custom()}
                    </Show>
                }
            >
                {/* the option carries the state as aria-busy; the spinner's own name would join the option's name */}
                <span aria-hidden="true">
                    <Spin wrapperClassName={`${prefixcls}-spin-icon ${prefixcls}-icon-left`} />
                </span>
            </Show>
        );
    };

    const TreeItem = (itemProps: { item: Entity; index: number; column: Column }) => {
        const key = () => itemProps.item.key;
        const showExpand = () => CascaderFoundation.isBranch(itemProps.item.data, props.loadData);
        const state = createMemo(() => CascaderFoundation.getTreeItemState(key(), props, props.multiple, showExpand()));
        return (
            <li
                id={props.optionId(key())}
                class={clsx(prefixcls, {
                    [`${prefixcls}-active`]: state().showActive,
                    [`${prefixcls}-select`]: state().showSelected,
                    [`${prefixcls}-disabled`]: itemProps.item.data.disabled,
                    [`${prefixcls}-focused`]: key() === props.keyboardKey,
                })}
                {...state().aria}
                aria-disabled={itemProps.item.data.disabled || undefined}
                aria-level={itemProps.column.level + 1}
                aria-posinset={itemProps.index + 1}
                aria-setsize={itemProps.column.items.length}
                role="treeitem"
                onClick={(e) => onClick(e, itemProps.item)}
                onMouseEnter={(e) => onHover(e, itemProps.item)}
            >
                <span class={`${prefixcls}-label`}>
                    <Show
                        when={props.multiple}
                        fallback={
                            <Show when={state().selected} fallback={<span class={`${prefixcls}-icon ${prefixcls}-icon-empty`} aria-hidden="true" />}>
                                <IconTick class={`${prefixcls}-icon ${prefixcls}-icon-active`} />
                            </Show>
                        }
                    >
                        {renderCheckbox(
                            () => itemProps.item,
                            () => itemProps.item.data.disabled
                        )}
                    </Show>
                    <span>
                        <Show when={props.renderLabel} keyed fallback={itemProps.item.data.label}>
                            {(render) => render(itemProps.item.data)}
                        </Show>
                    </span>
                </span>
                <Show when={showExpand()}>
                    <ExpandIcon loading={state().loading} />
                </Show>
            </li>
        );
    };

    const ResultContent = (contentProps: { item: Data }) => (
        <span class={`${prefixcls}-label`}>
            <Show when={props.multiple} fallback={<span class={`${prefixcls}-icon ${prefixcls}-icon-empty`} aria-hidden="true" />}>
                {renderCheckbox(
                    () => contentProps.item,
                    () => contentProps.item.disabled
                )}
            </Show>
            <For each={highlightParts(contentProps.item.searchText, props.keyword, props.separator ?? '')}>
                {(part) => (
                    <Show when={part.match} fallback={part.text}>
                        <span class={`${prefixcls}-label-highlight`}>{part.text}</span>
                    </Show>
                )}
            </For>
        </span>
    );

    const ResultRow = (rowProps: { item: Data; style?: JSX.CSSProperties }) => {
        const key = () => rowProps.item.key;
        const selected = () => props.selectedKeys.has(key());
        const className = () =>
            clsx(prefixcls, {
                [`${prefixcls}-flatten`]: !props.filterRender,
                [`${prefixcls}-disabled`]: rowProps.item.disabled,
                [`${prefixcls}-select`]: selected() && !props.multiple,
                [`${prefixcls}-focused`]: key() === props.keyboardKey,
            });
        const ariaDisabled = () => rowProps.item.disabled || undefined;
        const ariaSelected = () => (props.multiple ? props.checkedKeys.has(key()) : selected());
        const onItemClickInList = (e: MouseEvent) => onClick(e, rowProps.item);
        const onCheck = (e: CheckboxEvent) => onCheckboxChange(e, rowProps.item);

        const Rendered = (renderedProps: { render: NonNullable<CascaderItemProps['filterRender']> }) => {
            const renderProps: FilterRenderProps = {
                get class() {
                    return className();
                },
                get inputValue() {
                    return props.keyword;
                },
                get disabled() {
                    return rowProps.item.disabled;
                },
                get data() {
                    return rowProps.item.pathData ?? [];
                },
                get checkStatus() {
                    return { checked: props.checkedKeys.has(key()), halfChecked: props.halfCheckedKeys.has(key()) };
                },
                get selected() {
                    return selected();
                },
                onClick: onItemClickInList,
                onCheck,
            };
            const resolved = children(() => untrack(() => renderedProps.render(renderProps)));
            // only an element can carry the option's id and role; text and several nodes get an li around them
            const element = () => {
                const nodes = resolved.toArray();
                return nodes.length === 1 && nodes[0] instanceof HTMLElement ? nodes[0] : undefined;
            };

            createRenderEffect(() => {
                const node = element();
                if (!node) {
                    return;
                }
                node.id = props.optionId(key());
                node.setAttribute('role', 'option');
                node.setAttribute('aria-selected', String(ariaSelected()));
                if (ariaDisabled()) {
                    node.setAttribute('aria-disabled', 'true');
                } else {
                    node.removeAttribute('aria-disabled');
                }
                for (const [property, value] of Object.entries(rowProps.style ?? {})) {
                    node.style.setProperty(property, String(value));
                }
            });

            return (
                <Show when={element()} fallback={renderRow(resolved())}>
                    {resolved()}
                </Show>
            );
        };

        // the combobox handles the keys: it points at this option with aria-activedescendant
        const renderRow = (content: JSX.Element) => (
            <li id={props.optionId(key())} class={className()} style={rowProps.style} aria-disabled={ariaDisabled()} aria-selected={ariaSelected()} role="option" onClick={onItemClickInList}>
                {content}
            </li>
        );

        return (
            <Show when={props.filterRender} keyed fallback={renderRow(<ResultContent item={rowProps.item} />)}>
                {(render) => <Rendered render={render} />}
            </Show>
        );
    };

    const renderResults = () => (
        <Show
            when={props.virtualize}
            keyed
            fallback={
                <ul class={`${prefixcls}-list`} role="none">
                    <For each={results()}>{(item) => <ResultRow item={item} />}</For>
                </ul>
            }
        >
            {(virtualize) => (
                <VirtualList
                    ref={props.virtualListRef}
                    style={{ direction: config().direction }}
                    tabIndex={-1}
                    // Only a pixel height is usable: the visible rows are computed from it
                    height={virtualize.height ?? numbers.LIST_HEIGHT}
                    innerElementType={VirtualListInner}
                    itemCount={results().length}
                    itemData={results()}
                    itemKey={(index, data) => data[index].key}
                    itemSize={virtualize.itemSize}
                    width={virtualize.width ?? '100%'}
                >
                    {(row) => {
                        // the last row stays readable while it is disposed after its key left the list
                        const item = createMemo((previous?: Data) => row.data[row.index] ?? previous, row.data[row.index]) as Accessor<Data>;
                        return <ResultRow item={item()} style={row.style} />;
                    }}
                </VirtualList>
            )}
        </Show>
    );

    /**
     * One list per level of the active path, together one flat tree: aria-level, aria-setsize and aria-posinset carry
     * the hierarchy. Owning the next list as a group (aria-owns) would make it part of the branch's name.
     */
    const renderColumns = () => (
        <For each={columnKeys()}>
            {(key) => {
                const column = createMemo((previous?: Column) => columns().get(key) ?? previous) as Accessor<Column>;
                return (
                    <ul class={`${prefixcls}-list`} role="none" onScroll={(e) => props.onListScroll(e, column().level)}>
                        <For each={column().items}>{(item, index) => <TreeItem item={item} index={index()} column={column()} />}</For>
                    </ul>
                );
            }}
        </For>
    );

    return (
        <Show
            when={!isEmpty()}
            fallback={
                // the id stays for the combobox's aria-controls; with nothing to choose there is no tree or listbox
                <div id={props.id} class={clsx(`${prefixcls}-lists`, `${prefixcls}-lists-empty`)}>
                    <Show when={emptyContent() !== null}>
                        <div class={`${prefixcls} ${prefixcls}-empty`}>
                            <span class={`${prefixcls}-label`} x-semi-prop="emptyContent">
                                {hasContent(emptyContent()) ? emptyContent() : locale().locale.emptyText}
                            </span>
                        </div>
                    </Show>
                </div>
            }
        >
            <div id={props.id} class={`${prefixcls}-lists`} aria-label={props.labelProps['aria-label']} aria-labelledby={props.labelProps['aria-labelledby']} aria-multiselectable={props.multiple || undefined} role={props.searchable ? 'listbox' : 'tree'}>
                <Show when={props.searchable} fallback={renderColumns()}>
                    {renderResults()}
                </Show>
            </div>
        </Show>
    );
}
