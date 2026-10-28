<script setup lang="ts">
    import { Fragment, computed, h, nextTick, render, shallowRef, useAttrs, useId, useTemplateRef, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
    import TreeFoundation, { type BasicTreeInnerData, type BasicTreeNodeData, type BasicTreeProps, type TreeAdapter } from '@fibrae/semi-foundation/tree/foundation';
    import { buildRowProps, nodeId } from '@fibrae/semi-foundation/tree/shared';
    import '@fibrae/semi-foundation/tree/tree.scss';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { isAriaKey, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { rootAppContext } from '../_base/installed-app';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import slotNodes, { hasSlotContent, type KeyedNode } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import Input from '../input';
    import useLocale from '../locale/use-locale';
    import { provideTreeContext } from './context';
    import type { FlattenNode, TreeEmits, TreeExpandedOtherProps, TreeHandle, TreeNodeData, TreeProps, TreeRowProps, TreeSearchSlotProps, TreeSlots, TreeValue } from './interface';
    import NodeList from './node-list.vue';
    import TreeNode from './tree-node.vue';
    import useTreeKeyboard from './use-tree-keyboard';

    type Foundation = TreeFoundation<MouseEvent>;
    type Adapter = TreeAdapter<MouseEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TreeProps & /* @vue-ignore */ ElementProps<'div', keyof TreeProps | EmitHandlers<TreeEmits>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('Tree', 'defaultValue'),
        treeData: semiGlobalDefault('Tree', 'treeData'),
        treeDataSimpleJson: semiGlobalDefault('Tree', 'treeDataSimpleJson'),
        keyMaps: semiGlobalDefault('Tree', 'keyMaps'),
        expandedKeys: semiGlobalDefault('Tree', 'expandedKeys'),
        defaultExpandedKeys: semiGlobalDefault('Tree', 'defaultExpandedKeys'),
        defaultExpandAll: () => semiDefault('Tree', 'defaultExpandAll', false),
        expandAll: () => semiDefault('Tree', 'expandAll', false),
        autoExpandParent: () => semiDefault('Tree', 'autoExpandParent', false),
        autoExpandWhenDragEnter: () => semiDefault('Tree', 'autoExpandWhenDragEnter', true),
        autoMergeValue: () => semiDefault('Tree', 'autoMergeValue', true),
        blockNode: () => semiDefault('Tree', 'blockNode', true),
        checkRelation: () => semiDefault('Tree', 'checkRelation', 'related'),
        directory: () => semiDefault('Tree', 'directory', false),
        disabled: () => semiDefault('Tree', 'disabled', false),
        disableStrictly: () => semiDefault('Tree', 'disableStrictly', false),
        draggable: () => semiDefault('Tree', 'draggable', false),
        hideDraggingNode: () => semiDefault('Tree', 'hideDraggingNode', false),
        expandAction: () => semiDefault('Tree', 'expandAction', false),
        leafOnly: () => semiDefault('Tree', 'leafOnly', false),
        loadedKeys: semiGlobalDefault('Tree', 'loadedKeys'),
        motion: () => semiDefault('Tree', 'motion', true),
        multiple: () => semiDefault('Tree', 'multiple', false),
        changeWithObject: () => semiDefault('Tree', 'changeWithObject', false),
        showClear: () => semiDefault('Tree', 'showClear', true),
        showFilteredOnly: () => semiDefault('Tree', 'showFilteredOnly', false),
        showLine: () => semiDefault('Tree', 'showLine', false),
        treeNodeFilterProp: () => semiDefault('Tree', 'treeNodeFilterProp', 'label'),

        labelEllipsis: semiGlobalDefault('Tree', 'labelEllipsis'),
        virtualize: semiGlobalDefault('Tree', 'virtualize'),
        searchClassName: semiGlobalDefault('Tree', 'searchClassName'),
        searchPlaceholder: semiGlobalDefault('Tree', 'searchPlaceholder'),
        searchStyle: semiGlobalDefault('Tree', 'searchStyle'),
        filterTreeNode: undefined,
        loadData: undefined,
    });

    const emit = defineEmits<TreeEmits>();
    const slots = defineSlots<TreeSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('Tree');

    const treeId = useId();
    const nodeList = useTemplateRef('nodeList');
    const treeRoot = useTemplateRef('treeRoot');

    // Every row reads the context, and a dependency on state, even through a computed whose value stays the same, queues
    // every row's update on each state change (Vue's scheduler then scans that queue once per row patched). Refs written
    // only when the drop target changes keep the rows off state.
    const dragOverNodeKey = shallowRef<string | null>(null);
    const dropPosition = shallowRef<number | null>(null);

    const prefix = cssClasses.PREFIX;
    const filterTreeNode = computed(() => props.filterTreeNode ?? readSemiDefault(semi, 'Tree', 'filterTreeNode', false));
    const loadData = computed(() => props.loadData ?? readSemiDefault(semi, 'Tree', 'loadData'));
    const virtualized = computed(() => Boolean(props.virtualize && Object.keys(props.virtualize).length));

    // The foundation hands the element to setDragImage inside dragstart, so the slot mounts synchronously into a detached
    // root. Known limit: only the installed app's provides reach it; mounting inside the tree would need a render before dragstart.
    const dragImage = (nodeInstance: HTMLElement, node: BasicTreeNodeData): HTMLElement => {
        const container = document.createElement('div');
        const vnode = h(Fragment, slots.renderDraggingNode?.({ nodeInstance, node: node as TreeNodeData }));
        vnode.appContext = rootAppContext();
        render(vnode, container);
        // Queued before the foundation's timer that removes the element; the browser has captured the image by then
        setTimeout(() => render(null, container));
        return container;
    };

    const { foundation, state } = useFoundation<Foundation, Adapter, BasicTreeProps, BasicTreeInnerData>(
        TreeFoundation,
        props,
        (foundationProps) => TreeFoundation.getInitialState(foundationProps),
        (base) => ({
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            updateState: (states) => base.setState(states as BasicTreeInnerData),
            notifyExpand: (expandedKeys, info) => {
                emit('update:expandedKeys', [...expandedKeys]);
                emit('expand', [...expandedKeys], info as TreeExpandedOtherProps);
            },
            notifySelect: (selectKey, selected, node) => emit('select', selectKey, selected, node as TreeNodeData),
            notifyChange: (value) => {
                emit('update:modelValue', value as TreeValue);
                emit('change', value as TreeValue);
            },
            notifySearch: (input, filteredExpandedKeys) => emit('search', input, filteredExpandedKeys),
            notifyRightClick: (event, node) => emit('contextMenu', event, node as TreeNodeData),
            notifyDoubleClick: (event, node) => emit('doubleClick', event, node as TreeNodeData),
            notifyLoad: (loadedKeys, node) => {
                emit('update:loadedKeys', [...loadedKeys]);
                emit('load', loadedKeys, node as TreeNodeData);
            },
            notifyDragStart: (info) => emit('dragStart', info),
            notifyDragEnter: (info) => emit('dragEnter', info),
            notifyDragOver: (info) => emit('dragOver', info),
            notifyDragLeave: (info) => emit('dragLeave', info),
            notifyDragEnd: (info) => emit('dragEnd', info),
            notifyDrop: (info) => emit('drop', info),
            setCachedFlattenNodes: (cachedFlattenNodes) => base.setState({ cachedFlattenNodes }),
            // a search in the same call renders its rows on the next tick
            scrollToNode: (key, align) =>
                void nextTick(() => {
                    const index = base.getState('flattenNodes').findIndex((node) => node.key === key);
                    if (index !== -1) {
                        nodeList.value?.scrollToItem(index, align);
                    }
                }),
        }),
        {
            props: {
                value: () => props.modelValue as BasicTreeProps['value'],
                onChangeWithObject: () => props.changeWithObject,
                filterTreeNode: () => filterTreeNode.value as BasicTreeProps['filterTreeNode'],
                loadData: () => loadData.value as BasicTreeProps['loadData'],
                renderDraggingNode: () => (slots.renderDraggingNode ? dragImage : undefined),
            },
        }
    );

    // State implied by new props renders with them; the pre-flush watcher writes it back for the handlers before render
    const derived = computed(() => TreeFoundation.deriveState(foundation.getProps(), state.value));
    const view = computed(() => (derived.value ? { ...state.value, ...derived.value } : state.value));

    const rowProps = (node: FlattenNode) => buildRowProps(node, view.value, props) as TreeRowProps | null;

    const rows = () => view.value.flattenNodes as FlattenNode[];

    const cachedRows = () => view.value.cachedFlattenNodes as FlattenNode[] | undefined;

    const reveal = (index: number, key: string) => {
        if (!nodeList.value?.scrollToItem(index)) {
            // inside the tree, not the document: a tree in a ShadowRoot is out of document.getElementById's reach
            treeRoot.value?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
        }
    };

    const { keyboardKey, activeIndex, activeKey, handleKeyDown } = useTreeKeyboard({
        rows,
        defaultIndex: () =>
            Math.max(
                view.value.flattenNodes.findIndex((node) => view.value.selectedKeys.includes(node.key as string)),
                0
            ),
        rowProps,
        hasLoadData: () => Boolean(loadData.value),
        rtl: () => config.value.direction === 'rtl',
        select: (event, row) => foundation.handleNodeSelect(event, row),
        expand: (event, row) => foundation.handleNodeExpand(event, row),
        reveal,
    });

    const handleSearch = (value: string) => foundation.handleInputChange(value);

    // the tree takes the Tab stop, so a tabindex given to Tree (or injected by a wrapping Tooltip) goes there too
    const splitAttrs = () => splitControlAttrs(attrs, (key) => isAriaKey(key) || key === 'tabindex' || key === 'tabIndex');

    const treeTabIndex = () => (attrs.tabindex ?? attrs.tabIndex ?? 0) as number | string;

    const searchSlotProps = (): TreeSearchSlotProps => ({
        class: `${prefix}-input`,
        modelValue: view.value.inputValue,
        placeholder: props.searchPlaceholder || locale.value.locale.searchPlaceholder,
        showClear: props.showClear,
        onChange: handleSearch,
    });

    const searchNodes = (): KeyedNode[] => {
        const nodes = slots.search?.(searchSlotProps()) ?? [];
        return hasSlotContent(() => nodes) ? slotNodes(nodes) : [];
    };

    const noData = () => {
        const { keyEntities, inputValue, filteredKeys } = view.value;
        const searchNoRes = Boolean(inputValue) && !filteredKeys.size;
        return !keyEntities || Object.keys(keyEntities).length === 0 || (props.showFilteredOnly && searchNoRes);
    };

    const listClass = () => [`${prefix}-option-list`, { [`${prefix}-option-list-block`]: props.blockNode }];

    const handleTreeKeyDown = (event: KeyboardEvent) => {
        // a tabbable control inside a row handles its own keys
        if (event.target !== event.currentTarget && (event.target as HTMLElement).tabIndex >= 0) {
            return;
        }
        handleKeyDown(event);
    };

    const handleTreeFocus = (event: FocusEvent) => {
        const tree = event.currentTarget as HTMLElement;
        const target = event.target as HTMLElement;
        if (target !== tree) {
            // A click focuses the tabindex=-1 element it lands on (the virtual scroller, a row's checkbox); the tree takes
            // focus back, so aria-activedescendant and the row's focus ring keep working.
            if (target.tabIndex < 0) {
                tree.focus({ preventScroll: true });
            }
            return;
        }
        // A virtual list may not have rendered the active descendant yet. Pointer focus is skipped: mousedown focuses the
        // tree before click, and scrolling back to the stale active row would unmount the clicked row.
        if (tree.matches(':focus-visible')) {
            nodeList.value?.scrollToItem(activeIndex.value);
        }
    };

    const activate = (row: TreeRowProps) => {
        keyboardKey.value = row.key;
    };

    provideTreeContext({
        view: computed(() => ({
            treeDisabled: props.disabled,
            multiple: props.multiple,
            draggable: props.draggable,
            directory: props.directory,
            expandAction: props.expandAction,
            hasLoadData: Boolean(loadData.value),
            labelEllipsis: props.labelEllipsis ?? virtualized.value,
            dragOverNodeKey: dragOverNodeKey.value,
            dropPosition: dropPosition.value,
        })),
        onNodeExpand: (event, row) => {
            activate(row);
            foundation.handleNodeExpand(event, row);
        },
        onNodeSelect: (event, row) => {
            activate(row);
            foundation.handleNodeSelect(event, row);
        },
        onNodeCheck: (event, row) => {
            activate(row);
            foundation.handleNodeSelect(event, row);
        },
        onNodeRightClick: (event, row) => {
            activate(row);
            foundation.handleNodeRightClick(event, row);
        },
        onNodeDoubleClick: (event, row) => {
            activate(row);
            foundation.handleNodeDoubleClick(event, row);
        },
        onNodeDragStart: (event, row) => foundation.handleNodeDragStart(event, row),
        onNodeDragEnter: (event, row) => foundation.handleNodeDragEnter(event, row),
        onNodeDragOver: (event, row) => foundation.handleNodeDragOver(event, row),
        onNodeDragLeave: (event, row) => foundation.handleNodeDragLeave(event, row),
        onNodeDragEnd: (event, row) => foundation.handleNodeDragEnd(event, row),
        onNodeDrop: (event, row) => foundation.handleNodeDrop(event, row),
    });

    watch(derived, (value) => {
        if (value) {
            foundation.syncDerivedState(value);
        }
    });

    watch(
        [() => view.value.dragOverNodeKey, () => view.value.dropPosition],
        ([key, position]) => {
            dragOverNodeKey.value = key;
            dropPosition.value = position;
        },
        { immediate: true }
    );

    defineExpose<TreeHandle>({
        search: (value) => foundation.handleInputChange(value),
        scrollTo: (scrollData) => foundation.scrollTo(scrollData),
    });
</script>

<template>
    <div v-bind="splitAttrs().root" :class="`${prefix}-wrapper`">
        <template v-if="filterTreeNode">
            <template v-for="(nodes, i) in $slots.search ? [searchNodes()] : []" :key="i">
                <div v-if="nodes.length" :class="[`${prefix}-search-wrapper`, props.searchClassName]" :style="props.searchStyle">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </div>
            </template>
            <div v-if="!$slots.search" :class="[`${prefix}-search-wrapper`, props.searchClassName]" :style="props.searchStyle">
                <Input :aria-label="locale.locale.filter" :class="`${prefix}-input`" :modelValue="view.inputValue" :placeholder="props.searchPlaceholder || locale.locale.searchPlaceholder" :showClear="props.showClear" @change="handleSearch">
                    <template #prefix>
                        <IconSearch />
                    </template>
                </Input>
            </div>
        </template>
        <template v-if="noData()">
            <div v-if="!$slots.emptyContent || hasSlotContent($slots.emptyContent)" :class="listClass()" role="none">
                <ul :class="[`${prefix}-option`, `${prefix}-option-empty`]">
                    <li :class="[`${prefix}-option-label`, `${prefix}-option-label-empty`]" x-semi-prop="emptyContent">
                        <slot name="emptyContent">{{ locale.locale.emptyText }}</slot>
                    </li>
                </ul>
            </div>
        </template>
        <ul v-else ref="treeRoot" v-bind="splitAttrs().control" :aria-activedescendant="activeKey === undefined ? undefined : nodeId(treeId, activeKey)" :aria-multiselectable="props.multiple" :class="listClass()" role="tree" :tabindex="treeTabIndex()" @focusin="handleTreeFocus" @keydown="handleTreeKeyDown">
            <NodeList ref="nodeList" :flattenList="cachedRows()" :flattenNodes="rows()" :motion="props.motion" :motionKeys="view.motionKeys" :motionType="view.motionType" :virtualize="props.virtualize">
                <template #default="{ node, style }">
                    <template v-for="(row, i) in [rowProps(node)]" :key="i">
                        <TreeNode v-if="row" :id="nodeId(treeId, row.key)" :focused="row.key === activeKey" :row="row" :rowStyle="style" :showLine="props.showLine">
                            <template v-if="$slots.label" #label="p">
                                <slot :item="p.item" :label="p.label" name="label" :searchWord="p.searchWord" />
                            </template>
                            <template v-if="$slots.icon" #icon="p">
                                <slot :checked="p.checked" :expanded="p.expanded" :halfChecked="p.halfChecked" :isLeaf="p.isLeaf" :item="p.item" :level="p.level" :loading="p.loading" name="icon" :selected="p.selected" />
                            </template>
                            <template v-if="$slots.expandIcon" #expandIcon="p">
                                <slot :class="p.class" :expanded="p.expanded" name="expandIcon" :onClick="p.onClick" />
                            </template>
                            <template v-if="$slots.fullLabel" #fullLabel="p">
                                <slot
                                    :checkStatus="p.checkStatus"
                                    :class="p.class"
                                    :data="p.data"
                                    :expandIcon="p.expandIcon"
                                    :expandStatus="p.expandStatus"
                                    :filtered="p.filtered"
                                    :level="p.level"
                                    name="fullLabel"
                                    :onCheck="p.onCheck"
                                    :onClick="p.onClick"
                                    :onContextmenu="p.onContextmenu"
                                    :onDblclick="p.onDblclick"
                                    :onExpand="p.onExpand"
                                    :searchWord="p.searchWord"
                                />
                            </template>
                        </TreeNode>
                    </template>
                </template>
            </NodeList>
        </ul>
    </div>
</template>
