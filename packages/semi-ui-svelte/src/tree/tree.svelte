<script lang="ts">
    import { getAllContexts, mount, tick, unmount } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
    import TreeFoundation, { type BasicTreeInnerData, type BasicTreeNodeData, type BasicTreeProps, type TreeAdapter } from '@fibrae/semi-foundation/tree/foundation';
    import { buildRowProps, nodeId } from '@fibrae/semi-foundation/tree/shared';
    import '@fibrae/semi-foundation/tree/tree.scss';
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { isAriaKey, splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { useConfig } from '../config-provider/index.js';
    import Input from '../input/input.svelte';
    import { useLocale } from '../locale/index.js';
    import { setTreeContext } from './context.js';
    import DraggingNode from './dragging-node.svelte';
    import type { FlattenNode, TreeExpandedOtherProps, TreeNodeData, TreeProps, TreeRowProps, TreeScrollData, TreeValue } from './interface.js';
    import NodeList from './node-list.svelte';
    import TreeNode from './tree-node.svelte';
    import useTreeKeyboard from './use-tree-keyboard.svelte.js';

    type Foundation = TreeFoundation<MouseEvent>;
    type Adapter = TreeAdapter<MouseEvent>;
    type Bindable = 'value' | 'expandedKeys' | 'loadedKeys';

    const defaults = useDefaultProps('Tree');

    // No fallback on the bindable props: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        expandedKeys = $bindable(),
        loadedKeys = $bindable(),
        treeData = defaults('treeData'),
        treeDataSimpleJson = defaults('treeDataSimpleJson'),
        keyMaps = defaults('keyMaps'),
        defaultExpandAll = defaults('defaultExpandAll', false),
        expandAll = defaults('expandAll', false),
        autoExpandParent = defaults('autoExpandParent', false),
        autoExpandWhenDragEnter = defaults('autoExpandWhenDragEnter', true),
        autoMergeValue = defaults('autoMergeValue', true),
        blockNode = defaults('blockNode', true),
        checkRelation = defaults('checkRelation', 'related'),
        directory = defaults('directory', false),
        disabled = defaults('disabled', false),
        disableStrictly = defaults('disableStrictly', false),
        draggable = defaults('draggable', false),
        hideDraggingNode = defaults('hideDraggingNode', false),
        expandAction = defaults('expandAction', false),
        leafOnly = defaults('leafOnly', false),
        motion = defaults('motion', true),
        multiple = defaults('multiple', false),
        onChangeWithObject = defaults('onChangeWithObject', false),
        showClear = defaults('showClear', true),
        showFilteredOnly = defaults('showFilteredOnly', false),
        showLine = defaults('showLine', false),
        treeNodeFilterProp = defaults('treeNodeFilterProp', 'label'),
        labelEllipsis = defaults('labelEllipsis'),
        virtualize = defaults('virtualize'),
        searchClassName = defaults('searchClassName'),
        searchPlaceholder = defaults('searchPlaceholder'),
        searchStyle = defaults('searchStyle'),
        filterTreeNode = defaults('filterTreeNode', false),
        loadData = defaults('loadData'),
        onChange,
        onExpand,
        onLoad,
        onSelect,
        onSearch,
        onContextMenu,
        onDoubleClick,
        onDragStart,
        onDragEnter,
        onDragOver,
        onDragLeave,
        onDragEnd,
        onDrop,
        label,
        icon,
        expandIcon,
        fullLabel,
        // renamed: the instance method `search` takes the name
        search: searchBox,
        emptyContent,
        renderDraggingNode,
        ...rest
    }: TreeProps = $props();

    const config = useConfig();
    const locale = useLocale('Tree');

    const treeId = $props.id();
    let nodeList = $state<ReturnType<typeof NodeList>>();
    let treeRoot = $state<HTMLUListElement>();

    // the drag image mounts outside the tree; it gets the tree's contexts (theme, locale) handed over
    const contexts = getAllContexts();
    const prefixCls = cssClasses.PREFIX;

    // What the tree wrote back to a bindable prop while the prop was undefined, that is while the tree owned the state.
    // Not reactive on purpose: it changes only together with the prop it describes
    const echoes: Partial<Record<Bindable, { value: unknown }>> = {};

    // the tree takes the Tab stop, so a tabindex given to Tree (or injected by a wrapping Tooltip) goes there too
    const attrs = $derived(splitControlAttrs(rest, (key) => isAriaKey(key) || key === 'tabindex'));
    const listClass = $derived([`${prefixCls}-option-list`, { [`${prefixCls}-option-list-block`]: blockNode }]);
    const placeholder = $derived(searchPlaceholder || locale().locale.searchPlaceholder);

    /**
     * The tree writes every change back to its bindable props, bound or not. Its own write must not turn an
     * uncontrolled tree controlled: the foundation already updated its state, and deriving it again from the prop would
     * redo the expansion without its animation, or keep the search's expansion after the search clears. So the
     * foundation reads `undefined` for the tree's own echo until the parent passes something else.
     */
    const controlled = <T>(name: Bindable, current?: T) => (current !== undefined && echoes[name] && isEqual(current, echoes[name].value) ? undefined : current);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: BasicTreeProps = {
        get value() {
            return controlled('value', value) as BasicTreeProps['value'];
        },
        get expandedKeys() {
            return controlled('expandedKeys', expandedKeys);
        },
        get loadedKeys() {
            return controlled('loadedKeys', loadedKeys);
        },
        get treeData() {
            return treeData;
        },
        get treeDataSimpleJson() {
            return treeDataSimpleJson;
        },
        get keyMaps() {
            return keyMaps;
        },
        get defaultExpandAll() {
            return defaultExpandAll;
        },
        get expandAll() {
            return expandAll;
        },
        get autoExpandParent() {
            return autoExpandParent;
        },
        get autoExpandWhenDragEnter() {
            return autoExpandWhenDragEnter;
        },
        get autoMergeValue() {
            return autoMergeValue;
        },
        get checkRelation() {
            return checkRelation;
        },
        get disabled() {
            return disabled;
        },
        get disableStrictly() {
            return disableStrictly;
        },
        get hideDraggingNode() {
            return hideDraggingNode;
        },
        get leafOnly() {
            return leafOnly;
        },
        get motion() {
            return motion;
        },
        get multiple() {
            return multiple;
        },
        get onChangeWithObject() {
            return onChangeWithObject;
        },
        get showFilteredOnly() {
            return showFilteredOnly;
        },
        get treeNodeFilterProp() {
            return treeNodeFilterProp;
        },
        get filterTreeNode() {
            return filterTreeNode as BasicTreeProps['filterTreeNode'];
        },
        get loadData() {
            return loadData as BasicTreeProps['loadData'];
        },
        get renderDraggingNode() {
            const snippet = renderDraggingNode;
            return snippet ? (nodeInstance: HTMLElement, node: BasicTreeNodeData) => dragImage(snippet, nodeInstance, node) : undefined;
        },
    };

    /** Remembers whether the tree owned the prop when writing it back */
    const echo = (name: Bindable, next: unknown) => {
        echoes[name] = foundationProps[name] === undefined ? { value: next } : undefined;
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, BasicTreeProps, BasicTreeInnerData>(
        TreeFoundation,
        foundationProps,
        (view) => TreeFoundation.getInitialState(view),
        (base) => ({
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            updateState: (partial) => base.setState(partial as BasicTreeInnerData),
            notifyExpand: (keys, info) => {
                const next = [...keys];
                echo('expandedKeys', next);
                expandedKeys = next;
                onExpand?.([...keys], info as TreeExpandedOtherProps);
            },
            notifySelect: (selectKey, selected, node) => onSelect?.(selectKey, selected, node as TreeNodeData),
            notifyChange: (next) => {
                echo('value', next);
                value = next as TreeValue;
                onChange?.(next as TreeValue);
            },
            notifySearch: (input, filteredExpandedKeys) => onSearch?.(input, filteredExpandedKeys),
            notifyRightClick: (event, node) => onContextMenu?.(event, node as TreeNodeData),
            notifyDoubleClick: (event, node) => onDoubleClick?.(event, node as TreeNodeData),
            notifyLoad: (keys, node) => {
                const next = [...keys];
                echo('loadedKeys', next);
                loadedKeys = next;
                onLoad?.(keys, node as TreeNodeData);
            },
            notifyDragStart: (info) => onDragStart?.(info),
            notifyDragEnter: (info) => onDragEnter?.(info),
            notifyDragOver: (info) => onDragOver?.(info),
            notifyDragLeave: (info) => onDragLeave?.(info),
            notifyDragEnd: (info) => onDragEnd?.(info),
            notifyDrop: (info) => onDrop?.(info),
            setCachedFlattenNodes: (cachedFlattenNodes) => base.setState({ cachedFlattenNodes }),
            // a search in the same call renders its rows after the next update
            scrollToNode: (key, align) =>
                void tick().then(() => {
                    const index = base.getState('flattenNodes').findIndex((node) => node.key === key);
                    if (index !== -1) {
                        nodeList?.scrollToItem(index, align);
                    }
                }),
        })
    );

    const keyboard = useTreeKeyboard({
        rows: () => view.flattenNodes as FlattenNode[],
        defaultIndex: () =>
            Math.max(
                view.flattenNodes.findIndex((node) => view.selectedKeys.includes(node.key as string)),
                0
            ),
        rowProps: (node) => rowProps(node),
        hasLoadData: () => Boolean(loadData),
        rtl: () => config.direction === 'rtl',
        select: foundation.handleNodeSelect,
        expand: foundation.handleNodeExpand,
        reveal: (index, key) => {
            if (!nodeList?.scrollToItem(index)) {
                // inside the tree, not the document: a tree in a ShadowRoot is out of document.getElementById's reach
                treeRoot?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
            }
        },
    });

    // State implied by new props renders with them; the pre-effect writes it back for the handlers before render
    // not named `derived`: a local of that name turns the `$derived` rune into a store subscription
    const implied = $derived(TreeFoundation.deriveState(foundationProps, states()));
    const view = $derived<BasicTreeInnerData>(implied ? { ...states(), ...implied } : states());

    const noData = $derived.by(() => {
        const { keyEntities, inputValue, filteredKeys } = view;
        const searchNoRes = Boolean(inputValue) && !filteredKeys.size;
        return !keyEntities || Object.keys(keyEntities).length === 0 || (showFilteredOnly && searchNoRes);
    });

    setTreeContext({
        get treeDisabled() {
            return disabled;
        },
        get multiple() {
            return multiple;
        },
        get draggable() {
            return draggable;
        },
        get directory() {
            return directory;
        },
        get expandAction() {
            return expandAction;
        },
        get hasLoadData() {
            return Boolean(loadData);
        },
        get labelEllipsis() {
            return labelEllipsis ?? Boolean(virtualize && Object.keys(virtualize).length);
        },
        get dragOverNodeKey() {
            return view.dragOverNodeKey;
        },
        get dropPosition() {
            return view.dropPosition;
        },
        onNodeExpand: (event, row) => {
            keyboard.activate(row.key);
            foundation.handleNodeExpand(event, row);
        },
        onNodeSelect: (event, row) => {
            keyboard.activate(row.key);
            foundation.handleNodeSelect(event, row);
        },
        onNodeCheck: (event, row) => {
            keyboard.activate(row.key);
            foundation.handleNodeSelect(event, row);
        },
        onNodeRightClick: (event, row) => {
            keyboard.activate(row.key);
            foundation.handleNodeRightClick(event, row);
        },
        onNodeDoubleClick: (event, row) => {
            keyboard.activate(row.key);
            foundation.handleNodeDoubleClick(event, row);
        },
        onNodeDragStart: foundation.handleNodeDragStart,
        onNodeDragEnter: foundation.handleNodeDragEnter,
        onNodeDragOver: foundation.handleNodeDragOver,
        onNodeDragLeave: foundation.handleNodeDragLeave,
        onNodeDragEnd: foundation.handleNodeDragEnd,
        onNodeDrop: foundation.handleNodeDrop,
    });

    // The foundation hands the element to setDragImage inside dragstart, so the snippet mounts synchronously into a
    // detached element
    const dragImage = (snippet: NonNullable<TreeProps['renderDraggingNode']>, nodeInstance: HTMLElement, node: BasicTreeNodeData): HTMLElement => {
        const container = document.createElement('div');
        const instance = mount(DraggingNode, { target: container, props: { snippet, args: { nodeInstance, node: node as TreeNodeData } }, context: contexts });
        // Queued before the foundation's timer that removes the element; the browser has captured the image by then
        setTimeout(() => void unmount(instance));
        return container;
    };

    const rowProps = (node: FlattenNode) => {
        return buildRowProps(node, view, foundationProps) as TreeRowProps | null;
    };

    const handleSearch = (input: string) => foundation.handleInputChange(input);

    const handleTreeKeyDown = (event: KeyboardEvent) => {
        // a tabbable control inside a row handles its own keys
        if (event.target !== event.currentTarget && event.target instanceof HTMLElement && event.target.tabIndex >= 0) {
            return;
        }
        keyboard.handleKeyDown(event);
    };

    const handleTreeFocus = (event: FocusEvent & { currentTarget: HTMLElement }) => {
        const tree = event.currentTarget;
        const target = event.target;
        if (target !== tree) {
            // A click focuses the tabindex=-1 element it lands on (the virtual scroller, a row's checkbox); the tree takes
            // focus back, so aria-activedescendant and the row's focus ring keep working.
            if (target instanceof HTMLElement && target.tabIndex < 0) {
                tree.focus({ preventScroll: true });
            }
            return;
        }
        // A virtual list may not have rendered the active descendant yet. Pointer focus is skipped: mousedown focuses the
        // tree before click, and scrolling back to the stale active row would unmount the clicked row.
        if (tree.matches(':focus-visible')) {
            nodeList?.scrollToItem(keyboard.activeIndex);
        }
    };

    $effect.pre(() => {
        if (implied) {
            foundation.syncDerivedState(implied);
        }
    });

    // once the parent passes a value of its own, an earlier echo no longer describes the prop
    watch(
        () => [value, expandedKeys, loadedKeys] as const,
        (current) => {
            // The foundation never saw its own echo as the prop, so clearing the prop back to undefined is no change to
            // it: the selection is emptied here
            if (current[0] === undefined && echoes.value && echoes.value.value !== undefined) {
                foundation.syncDerivedState({ selectedKeys: [], checkedKeys: new Set(), halfCheckedKeys: new Set(), realCheckedKeys: new Set() });
            }
            (['value', 'expandedKeys', 'loadedKeys'] as const).forEach((name, i) => {
                if (echoes[name] && !isEqual(current[i], echoes[name].value)) {
                    echoes[name] = undefined;
                }
            });
        }
    );

    /** Searches as if typed into the search box; needs `filterTreeNode` */
    export function search(input: string) {
        foundation.handleInputChange(input);
    }

    /** Scrolls a virtualized tree to an expanded node */
    export function scrollTo(scrollData: TreeScrollData) {
        foundation.scrollTo(scrollData);
    }
</script>

<div {...attrs.root} class={[`${prefixCls}-wrapper`, rest.class]}>
    {#if filterTreeNode && searchBox !== false}
        <div class={[`${prefixCls}-search-wrapper`, searchClassName]} style={searchStyle}>
            {#if searchBox}
                {@render searchBox({ class: `${prefixCls}-input`, value: view.inputValue, placeholder, showClear, onChange: handleSearch })}
            {:else}
                <Input aria-label={locale().locale.filter} class="{prefixCls}-input" onChange={handleSearch} {placeholder} {showClear} value={view.inputValue}>
                    {#snippet prefix()}
                        <IconSearch />
                    {/snippet}
                </Input>
            {/if}
        </div>
    {/if}
    {#if noData}
        <div class={listClass} role="none">
            <ul class={[`${prefixCls}-option`, `${prefixCls}-option-empty`]}>
                <li class={[`${prefixCls}-option-label`, `${prefixCls}-option-label-empty`]} x-semi-prop="emptyContent">
                    {#if emptyContent}
                        {@render emptyContent()}
                    {:else}
                        {locale().locale.emptyText}
                    {/if}
                </li>
            </ul>
        </div>
    {:else}
        <ul
            bind:this={treeRoot}
            {...attrs.control}
            aria-activedescendant={keyboard.activeKey === undefined ? undefined : nodeId(treeId, keyboard.activeKey)}
            aria-multiselectable={multiple}
            class={listClass}
            role="tree"
            tabindex={(attrs.control.tabindex as number | undefined) ?? 0}
            onfocusin={handleTreeFocus}
            onkeydown={handleTreeKeyDown}
        >
            <NodeList bind:this={nodeList} flattenList={view.cachedFlattenNodes} flattenNodes={view.flattenNodes} {motion} motionKeys={view.motionKeys} motionType={view.motionType} {virtualize}>
                {#snippet children({ node, style })}
                    {@const row = rowProps(node)}
                    {#if row}
                        <TreeNode {expandIcon} focused={row.key === keyboard.activeKey} {fullLabel} {icon} id={nodeId(treeId, row.key)} {label} {row} rowStyle={style} {showLine} />
                    {/if}
                {/snippet}
            </NodeList>
        </ul>
    {/if}
</div>
