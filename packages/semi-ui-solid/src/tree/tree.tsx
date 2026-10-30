import { type Accessor, type JSX, Show, batch, children, createComputed, createEffect, createMemo, createSelector, createSignal, createUniqueId, on, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
import TreeFoundation, { type BasicTreeInnerData, type BasicTreeProps, type ScrollAlign, type TreeAdapter, treeDerivedPropKeys } from '@fibrae/semi-foundation/tree/foundation';
import { buildRowProps, nodeId } from '@fibrae/semi-foundation/tree/shared';
import '@fibrae/semi-foundation/tree/tree.scss';
import { IconSearch } from '@fibrae/semi-icons-solid';
import { splitControlAttrs } from '../_base/control-attrs';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import type { VirtualListHandle } from '../_base/virtual-list';
import useConfig from '../config-provider/use-config';
import Input from '../input';
import useLocale from '../locale/use-locale';
import { TreeContext, type TreeContextValue } from './context';
import type { DragEnterProps, DragProps, ExpandedOtherProps, FlattenNode, OnDragProps, ScrollData, SearchRenderProps, TreeElement, TreeNodeData, TreeProps, TreeRowProps, Value } from './interface';
import NodeList from './node-list';
import TreeNode from './tree-node';
import useTreeKeyboard from './use-tree-keyboard';
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
const isTreeAttr = (key: string): key is `aria-${string}` | 'tabIndex' => key.startsWith('aria-') || key === 'tabIndex';

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
        'searchClassName',
        'searchPlaceholder',
        'searchRender',
        'searchStyle',
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
    // deriveState compares treeData by reference and keeps a copy of the props: it reads one snapshot per prop change,
    // or every write-back would look like new data and never settle. Only its own keys are read, so JSX props (icon,
    // emptyContent) are not created for nothing.
    const snapshot = createMemo(() => Object.fromEntries(treeDerivedPropKeys.map((key) => [key, (props as BasicTreeProps)[key]])) as BasicTreeProps);

    const { foundation, state } = useFoundation<Foundation, Adapter, BasicTreeProps, BasicTreeInnerData>(
        TreeFoundation,
        props as BasicTreeProps,
        () => TreeFoundation.getInitialState(snapshot()),
        (base) => ({
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            updateState: (states) => base.setState(states as BasicTreeInnerData),
            notifyExpand: (expandedKeys, info) => local.onExpand?.([...expandedKeys], info as ExpandedOtherProps),
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
            setCachedFlattenNodes: (cachedFlattenNodes) => base.setState({ cachedFlattenNodes }),
            // the effect below scrolls once the rows of a search in the same call are rendered
            scrollToNode: (key, align) => setScrollRequest({ key, align }),
        })
    );

    // read here, untracked: the Provider's children run in a memo that would track it
    const ref = props.ref;

    // the state that new props imply; written back before the DOM updates, so rows and handlers read one state
    const derived = createMemo(() => TreeFoundation.deriveState(snapshot(), state()));
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

    const reveal = (index: number, key: string) => {
        if (list) {
            list.scrollToItem(index);
            return;
        }
        // inside the tree, not the document: a tree in a ShadowRoot is out of document.getElementById's reach
        treeElement?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
    };

    const { setKeyboardKey, activeIndex, activeKey, handleKeyDown } = useTreeKeyboard({
        rows,
        defaultIndex: () =>
            Math.max(
                rows().findIndex((node) => state().selectedKeys.includes(node.key)),
                0
            ),
        rowProps,
        hasLoadData: () => Boolean(local.loadData),
        rtl: () => config().direction === 'rtl',
        select: foundation.handleNodeSelect,
        expand: foundation.handleNodeExpand,
        reveal,
    });

    const isActive = createSelector(activeKey);

    const listClass = () => clsx(`${prefix}-option-list`, { [`${prefix}-option-list-block`]: local.blockNode });

    const noData = () => {
        const { keyEntities, inputValue, filteredKeys } = state();
        const searchNoRes = Boolean(inputValue) && !filteredKeys.size;
        return !keyEntities || Object.keys(keyEntities).length === 0 || (local.showFilteredOnly && searchNoRes);
    };

    const searchRender = () => (typeof local.searchRender === 'function' ? local.searchRender : undefined);

    // the row a pointer acts on becomes the keyboard's row, in the same commit as the foundation's update
    const activate = (row: TreeRowProps, action: () => void) =>
        batch(() => {
            setKeyboardKey(row.key);
            action();
        });

    const contextValue: TreeContextValue = {
        view: contextView,
        icon: () => local.icon,
        onNodeExpand: (e, row) => activate(row, () => foundation.handleNodeExpand(e, row)),
        onNodeSelect: (e, row) => activate(row, () => foundation.handleNodeSelect(e, row)),
        onNodeCheck: (e, row) => activate(row, () => foundation.handleNodeSelect(e, row)),
        onNodeRightClick: (e, row) => activate(row, () => foundation.handleNodeRightClick(e, row)),
        onNodeDoubleClick: (e, row) => activate(row, () => foundation.handleNodeDoubleClick(e, row)),
        onNodeDragStart: foundation.handleNodeDragStart,
        onNodeDragEnter: foundation.handleNodeDragEnter,
        onNodeDragOver: foundation.handleNodeDragOver,
        onNodeDragLeave: foundation.handleNodeDragLeave,
        onNodeDragEnd: foundation.handleNodeDragEnd,
        onNodeDrop: foundation.handleNodeDrop,
    };

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

    const handleTreeKeyDown = (event: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        // a tabbable control inside a row handles its own keys
        if (event.target !== event.currentTarget && event.target instanceof HTMLElement && event.target.tabIndex >= 0) {
            return;
        }
        handleKeyDown(event);
    };

    const handleFocusIn = (event: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        const tree = event.currentTarget;
        if (event.target !== tree) {
            // a click focuses the tabindex=-1 element it lands on (the virtual scroller, a row's checkbox); the tree
            // takes focus back, so aria-activedescendant and the row's focus ring keep working
            if (event.target instanceof HTMLElement && event.target.tabIndex < 0) {
                tree.focus({ preventScroll: true });
            }
            return;
        }
        // a virtual list may not have rendered the active row; pointer focus is skipped because scrolling back to the
        // stale active row would unmount the clicked row
        if (tree.matches(':focus-visible')) {
            list?.scrollToItem(activeIndex());
        }
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
                    <div class={clsx(`${prefix}-search-wrapper`, local.searchClassName)} style={local.searchStyle}>
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
                        aria-activedescendant={activeKey() === undefined ? undefined : nodeId(treeId, activeKey() as string)}
                        aria-multiselectable={Boolean(local.multiple)}
                        class={listClass()}
                        role="tree"
                        tabIndex={treeAttrs.tabIndex ?? 0}
                        onFocusIn={handleFocusIn}
                        onKeyDown={handleTreeKeyDown}
                    >
                        <NodeList flattenList={state().cachedFlattenNodes as FlattenNode[] | undefined} flattenNodes={rows()} listRef={(handle) => (list = handle)} motion={Boolean(local.motion)} motionKeys={state().motionKeys} motionType={state().motionType} renderRow={renderRow} virtualize={local.virtualize} />
                    </div>
                </Show>
            </div>
        </TreeContext.Provider>
    );
}
