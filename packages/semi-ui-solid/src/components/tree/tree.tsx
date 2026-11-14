import { type Accessor, type JSX, Show, children, createComputed, createEffect, createMemo, createSelector, createSignal, createUniqueId, on, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/tree/constants';
import TreeFoundation, { type BasicTreeInnerData, type BasicTreeProps, type ScrollAlign, type TreeAdapter } from '@fibrae/semi-foundation/components/tree/foundation';
import { buildRowProps, handleTreeFocusIn, nodeId } from '@fibrae/semi-foundation/components/tree/shared';
import { isAriaKey } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/tree/tree.scss';
import { IconSearch } from '@fibrae/semi-icons-solid';
import { useDefaultProps, useFoundation } from '../../base/index';
import type { VirtualListHandle } from '../../internal/index';
import { splitControlAttrs, hasContent, mergeRefs } from '../../utils/index';
import useConfig from '../config-provider/use-config';
import Input from '../input';
import useLocale from '../locale/use-locale';
import { TreeContext, type TreeContextValue } from './context';
import type { DragEnterProps, DragProps, ExpandedOtherProps, FlattenNode, OnDragProps, ScrollData, SearchRenderProps, TreeElement, TreeNodeData, TreeProps, TreeRowProps, Value } from './interface';
import NodeList from './node-list';
import TreeNode from './tree-node';
import { sameRow } from './utils';

type Foundation = TreeFoundation<MouseEvent>;
type Adapter = TreeAdapter<MouseEvent>;

const prefix = cssClasses.PREFIX;

const defaultProps = {
    showClear: true,
    disabled: false,
    blockNode: true,
    multiple: false,
    filterTreeNode: false,
    autoExpandParent: false,
    treeNodeFilterProp: 'label',
    defaultExpandAll: false,
    expandAll: false,
    onChangeWithObject: false,
    motion: true,
    leafOnly: false,
    showFilteredOnly: false,
    showLine: false,
    expandAction: false,
    disableStrictly: false,
    draggable: false,
    autoExpandWhenDragEnter: true,
    checkRelation: 'related',
    autoMergeValue: true,
} satisfies Partial<TreeProps>;

// the tree takes the Tab stop and is the element its name describes, so a wrapping Tooltip's tabIndex goes there too
const isTreeAttr = (key: string): key is `aria-${string}` | 'tabIndex' => isAriaKey(key) || key === 'tabIndex';

export default function Tree(rawProps: TreeProps) {
    const props = useDefaultProps('Tree', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'autoExpandParent',
        'autoExpandWhenDragEnter',
        'autoMergeValue',
        'blockNode',
        'checkRelation',
        'class',
        'defaultExpandAll',
        'defaultExpandedKeys',
        'defaultValue',
        'directory',
        'disableStrictly',
        'disabled',
        'draggable',
        'emptyContent',
        'expandAction',
        'expandAll',
        'expandIcon',
        'expandedKeys',
        'filterTreeNode',
        'hideDraggingNode',
        'icon',
        'keyMaps',
        'labelEllipsis',
        'leafOnly',
        'loadData',
        'loadedKeys',
        'motion',
        'multiple',
        'onChange',
        'onChangeWithObject',
        'onContextMenu',
        'onDoubleClick',
        'onDragEnd',
        'onDragEnter',
        'onDragLeave',
        'onDragOver',
        'onDragStart',
        'onDrop',
        'onExpand',
        'onLoad',
        'onSearch',
        'onSelect',
        'ref',
        'renderDraggingNode',
        'renderFullLabel',
        'renderLabel',
        'classNames',
        'searchPlaceholder',
        'searchRender',
        'styles',
        'showClear',
        'showFilteredOnly',
        'showLine',
        'style',
        'treeData',
        'treeDataSimpleJson',
        'treeNodeFilterProp',
        'value',
        'virtualize',
    ]);

    const [treeAttrs, rootAttrs] = splitControlAttrs(rest, isTreeAttr);

    const config = useConfig();
    const locale = useLocale('Tree');

    const treeId = createUniqueId();
    const [scrollRequest, setScrollRequest] = createSignal<{ key: string; align: ScrollAlign } | null>(null);
    let list: VirtualListHandle | undefined;
    let treeElement: HTMLDivElement | undefined;

    // An expression prop such as `treeData={list().map(...)}` is a getter that builds a new array on every read, while
    // deriveState compares treeData by reference and keeps a snapshot of the props: it reads one snapshot per prop
    // change, or every write-back would look like new data and never settle. Only its own keys are read, so JSX props
    // (icon, emptyContent) are not created for nothing.
    const snapshot = createMemo(() => Object.fromEntries(TreeFoundation.propKeys.map((key) => [key, (props as BasicTreeProps)[key]])) as BasicTreeProps);

    const { foundation, state } = useFoundation<Foundation, Adapter, BasicTreeProps, BasicTreeInnerData>(
        TreeFoundation,
        props as BasicTreeProps,
        () => TreeFoundation.getInitialState(snapshot()),
        () => ({
            notifyExpand: (expandedKeys, info) => local.onExpand?.(expandedKeys, info as ExpandedOtherProps),
            notifySelect: (selectKey, selected, node) => local.onSelect?.(selectKey, selected, node as TreeNodeData),
            notifyChange: (value) => local.onChange?.(value as Value),
            notifySearch: (input, filteredExpandedKeys) => local.onSearch?.(input, filteredExpandedKeys),
            notifyRightClick: (e, node) => local.onContextMenu?.(e, node as TreeNodeData),
            notifyDoubleClick: (e, node) => local.onDoubleClick?.(e, node as TreeNodeData),
            notifyLoad: (loadedKeys, node) => local.onLoad?.(loadedKeys, node as TreeNodeData),
            notifyDragStart: (info) => local.onDragStart?.(info as DragProps),
            notifyDragEnter: (info) => local.onDragEnter?.(info as DragEnterProps),
            notifyDragOver: (info) => local.onDragOver?.(info as DragProps),
            notifyDragLeave: (info) => local.onDragLeave?.(info as DragProps),
            notifyDragEnd: (info) => local.onDragEnd?.(info as DragProps),
            notifyDrop: (info) => local.onDrop?.(info as OnDragProps),
            // the effect below scrolls once the rows of a search in the same call are rendered
            scrollToNode: (key, align) => setScrollRequest({ key, align }),
            revealRow: (index, key) => {
                if (list) {
                    list.scrollToItem(index);
                    return;
                }
                // inside the tree, not the document: a tree in a ShadowRoot is out of document.getElementById's reach
                treeElement?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
            },
        }),
        { context: () => ({ direction: config().direction }) }
    );

    // read here, untracked: the Provider's children run in a memo that would track it
    const ref = props.ref;
    const derived = createMemo(() => TreeFoundation.deriveState(snapshot(), state()));
    const activeIndex = createMemo(() => TreeFoundation.getActiveIndex(state()));
    const activeKey = createMemo(() => state().flattenNodes[activeIndex()]?.key);
    const isActive = createSelector(activeKey);
    const resolvedEmpty = children(() => local.emptyContent);

    const contextView = createMemo(() => ({
        treeDisabled: Boolean(local.disabled),
        multiple: Boolean(local.multiple),
        draggable: Boolean(local.draggable),
        directory: Boolean(local.directory),
        expandAction: local.expandAction ?? false,
        hasLoadData: Boolean(local.loadData),
        labelEllipsis: Boolean(local.labelEllipsis ?? local.virtualize),
        dragOverNodeKey: state().dragOverNodeKey,
        dropPosition: state().dropPosition,
        renderLabel: local.renderLabel,
        renderFullLabel: local.renderFullLabel,
    }));

    const contextValue: TreeContextValue = {
        view: contextView,
        icon: () => local.icon,
        onNodeExpand: foundation.handleNodeExpand,
        onNodeSelect: foundation.handleNodeSelect,
        onNodeCheck: foundation.handleNodeSelect,
        onNodeRightClick: foundation.handleNodeRightClick,
        onNodeDoubleClick: foundation.handleNodeDoubleClick,
        onNodeDragStart: foundation.handleNodeDragStart,
        onNodeDragEnter: foundation.handleNodeDragEnter,
        onNodeDragOver: foundation.handleNodeDragOver,
        onNodeDragLeave: foundation.handleNodeDragLeave,
        onNodeDragEnd: foundation.handleNodeDragEnd,
        onNodeDrop: foundation.handleNodeDrop,
    };

    const searchProps: SearchRenderProps = {
        class: `${prefix}-input`,
        get value() {
            return state().inputValue;
        },
        onChange: foundation.handleInputChange,
        get prefix() {
            return <IconSearch />;
        },
        get showClear() {
            return local.showClear;
        },
        get placeholder() {
            return local.searchPlaceholder || locale().locale.searchPlaceholder;
        },
    };

    const setRoot = (node: HTMLDivElement) => {
        const element: TreeElement = Object.assign(node, {
            search: (value: string) => foundation.handleInputChange(value),
            // the root keeps the native scrollTo(options) and scrollTo(x, y); only a ScrollData has a key
            scrollTo: (...args: unknown[]) => (typeof args[0] === 'object' && args[0] !== null && 'key' in args[0] ? foundation.scrollTo(args[0] as ScrollData) : Element.prototype.scrollTo.apply(node, args as Parameters<Element['scrollTo']>)),
        });
        mergeRefs(ref)(element);
    };

    const rows = () => state().flattenNodes as FlattenNode[];

    const rowProps = (node: FlattenNode) => buildRowProps(node, state(), props) as TreeRowProps | null;

    const listClass = () => clsx(`${prefix}-option-list`, { [`${prefix}-option-list-block`]: local.blockNode });

    const noData = () => {
        const { keyEntities, inputValue, filteredKeys } = state();
        const searchNoRes = Boolean(inputValue) && !filteredKeys.size;
        return !keyEntities || Object.keys(keyEntities).length === 0 || (local.showFilteredOnly && searchNoRes);
    };

    const searchRender = () => (typeof local.searchRender === 'function' ? local.searchRender : undefined);

    const renderRow = (node: Accessor<FlattenNode | undefined>, style?: Accessor<JSX.CSSProperties>) => {
        const row = createMemo(
            () => {
                const current = node();
                return current ? rowProps(current) : null;
            },
            null,
            { equals: sameRow }
        );
        return <Show when={row()}>{(current) => <TreeNode expandIcon={local.expandIcon} focused={isActive(current().key)} id={nodeId(treeId, current().key)} row={current()} showLine={local.showLine} style={style?.()} />}</Show>;
    };

    const handleFocusIn = (event: FocusEvent & { currentTarget: HTMLDivElement }) => {
        const index = activeIndex();
        handleTreeFocusIn(event, () => list?.scrollToItem(index));
    };

    createComputed(on(derived, (value) => value && foundation.syncDerivedState(value)));

    createEffect(() => {
        const request = scrollRequest();
        if (!request) {
            return;
        }
        const index = rows().findIndex((node) => node.key === request.key);
        setScrollRequest(null);
        if (index !== -1) {
            list?.scrollToItem(index, request.align);
        }
    });

    return (
        <TreeContext.Provider value={contextValue}>
            <div {...rootAttrs} ref={setRoot} class={clsx(`${prefix}-wrapper`, local.class)} style={local.style}>
                <Show when={local.filterTreeNode && local.searchRender !== false}>
                    <div class={clsx(`${prefix}-search-wrapper`, local.classNames?.search)} style={local.styles?.search}>
                        <Show
                            keyed
                            when={searchRender()}
                            fallback={
                                <Input
                                    addonAfter={null}
                                    addonBefore={null}
                                    aria-label={locale().locale.filter}
                                    class={searchProps.class}
                                    insetLabel={null}
                                    placeholder={searchProps.placeholder}
                                    prefix={<IconSearch />}
                                    showClear={searchProps.showClear}
                                    suffix={null}
                                    value={searchProps.value}
                                    onChange={(value) => searchProps.onChange(value)}
                                />
                            }
                        >
                            {(render) => render(searchProps)}
                        </Show>
                    </div>
                </Show>
                <Show
                    when={!noData()}
                    fallback={
                        <Show when={resolvedEmpty() !== null}>
                            <div class={listClass()} role="none">
                                <ul class={clsx(`${prefix}-option`, `${prefix}-option-empty`)}>
                                    <li class={clsx(`${prefix}-option-label`, `${prefix}-option-label-empty`)} x-semi-prop="emptyContent">
                                        {hasContent(resolvedEmpty()) ? resolvedEmpty() : locale().locale.emptyText}
                                    </li>
                                </ul>
                            </div>
                        </Show>
                    }
                >
                    <div
                        {...treeAttrs}
                        ref={(node) => (treeElement = node)}
                        aria-activedescendant={activeKey() === undefined ? undefined : nodeId(treeId, activeKey()!)}
                        aria-multiselectable={Boolean(local.multiple)}
                        class={listClass()}
                        role="tree"
                        tabIndex={treeAttrs.tabIndex ?? 0}
                        onFocusIn={handleFocusIn}
                        onKeyDown={foundation.handleKeyDown}
                    >
                        <NodeList flattenList={state().cachedFlattenNodes as FlattenNode[] | undefined} flattenNodes={rows()} listRef={(handle) => (list = handle)} motion={Boolean(local.motion)} motionKeys={state().motionKeys} motionType={state().motionType} renderRow={renderRow} virtualize={local.virtualize} />
                    </div>
                </Show>
            </div>
        </TreeContext.Provider>
    );
}
