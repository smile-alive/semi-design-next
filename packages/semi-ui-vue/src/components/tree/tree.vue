<script setup lang="ts">
    import { Fragment, computed, h, nextTick, render, shallowRef, useAttrs, useId, useTemplateRef, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/tree/constants';
    import TreeFoundation, { type BasicTreeInnerData, type BasicTreeNodeData, type BasicTreeProps, type TreeAdapter } from '@fibrae/semi-foundation/components/tree/foundation';
    import { buildRowProps, handleTreeFocusIn, nodeId } from '@fibrae/semi-foundation/components/tree/shared';
    import '@fibrae/semi-foundation/components/tree/tree.scss';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { type ElementProps, type EmitHandlers, rootAppContext, semiDefault, readSemiDefault, semiGlobalDefault, useSemiGlobal, useFoundation } from '../../base/index';
    import { isAriaKey, splitControlAttrs, slotNodes, hasSlotContent, type KeyedNode } from '../../utils/index';
    import useConfig from '../config-provider/use-config';
    import Input from '../input';
    import useLocale from '../locale/use-locale';
    import { provideTreeContext } from './context';
    import type { FlattenNode, TreeEmits, TreeExpandedOtherProps, TreeHandle, TreeNodeData, TreeProps, TreeRowProps, TreeSearchSlotProps, TreeSlots, TreeValue } from './interface';
    import NodeList from './node-list.vue';
    import TreeNode from './tree-node.vue';

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
            notifyExpand: (expandedKeys, info) => {
                emit('update:expandedKeys', expandedKeys);
                emit('expand', expandedKeys, info as TreeExpandedOtherProps);
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
            // a search in the same call renders its rows on the next tick
            scrollToNode: (key, align) =>
                void nextTick(() => {
                    const index = base.getState('flattenNodes').findIndex((node) => node.key === key);
                    if (index !== -1) {
                        nodeList.value?.scrollToItem(index, align);
                    }
                }),
            revealRow: (index, key) => {
                if (!nodeList.value?.scrollToItem(index)) {
                    // inside the tree, not the document: a tree in a ShadowRoot is out of document.getElementById's reach
                    treeRoot.value?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
                }
            },
        }),
        {
            context: () => ({ direction: config.value.direction }),
            props: {
                value: () => props.modelValue as BasicTreeProps['value'],
                onChangeWithObject: () => props.changeWithObject,
                filterTreeNode: () => filterTreeNode.value as BasicTreeProps['filterTreeNode'],
                loadData: () => loadData.value as BasicTreeProps['loadData'],
                renderDraggingNode: () => (slots.renderDraggingNode ? dragImage : undefined),
            },
        }
    );

    const derived = computed(() => TreeFoundation.deriveState(foundation.getProps(), state.value));
    const view = computed(() => (derived.value ? { ...state.value, ...derived.value } : state.value));
    const activeIndex = computed(() => TreeFoundation.getActiveIndex(view.value));
    const activeKey = computed(() => view.value.flattenNodes[activeIndex.value]?.key);

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
    });

    const rowProps = (node: FlattenNode) => buildRowProps(node, view.value, props) as TreeRowProps | null;

    const rows = () => view.value.flattenNodes as FlattenNode[];

    const cachedRows = () => view.value.cachedFlattenNodes as FlattenNode[] | undefined;

    const handleSearch = (value: string) => foundation.handleInputChange(value);

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

    const handleTreeFocus = (event: FocusEvent) => handleTreeFocusIn(event as FocusEvent & { currentTarget: HTMLElement }, () => nodeList.value?.scrollToItem(activeIndex.value));

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
        search: foundation.handleInputChange,
        scrollTo: foundation.scrollTo,
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
        <ul v-else ref="treeRoot" v-bind="splitAttrs().control" :aria-activedescendant="activeKey === undefined ? undefined : nodeId(treeId, activeKey)" :aria-multiselectable="props.multiple" :class="listClass()" role="tree" :tabindex="treeTabIndex()" @focusin="handleTreeFocus" @keydown="foundation.handleKeyDown">
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
