<script setup lang="ts">
    import { h, normalizeClass, onBeforeUnmount, type VNode } from 'vue';
    import { debounce } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
    import { getTreeLabelClassMap, getTreeRowAria, getTreeRowClassMap, isTreeNodeLeaf, type TreeRowFlags } from '@fibrae/semi-foundation/tree/shared';
    import { IconFile, IconFolder, IconFolderOpen } from '@fibrae/semi-icons-vue';
    import slotNodes, { hasSlotContent, type KeyedNode } from '../_base/slot-nodes';
    import Checkbox from '../checkbox';
    import Highlight from '../highlight';
    import { useTreeContext } from './context';
    import type { TreeExpandIconSlotProps, TreeFullLabelSlotProps, TreeIconSlotProps, TreeLabelSlotProps, TreeNodeProps, TreeRowProps } from './interface';
    import NodeArrow from './node-arrow.vue';

    /**
     * One row of the tree. The row takes no focus: the tree keeps it and points at the row with aria-activedescendant
     * (`id`, `focused`), so the keys are handled by the tree, and the arrow and the checkbox inside are only pictures of
     * the row's state. Every interaction reports the whole `row` to the tree through the context.
     */
    defineOptions({ inheritAttrs: false });
    const props = withDefaults(defineProps<TreeNodeProps>(), { focused: false, showLine: false, rowStyle: undefined });

    const slots = defineSlots<{
        label?: (props: TreeLabelSlotProps) => VNode[];
        icon?: (props: TreeIconSlotProps) => VNode[];
        expandIcon?: (props: TreeExpandIconSlotProps) => VNode[];
        fullLabel?: (props: TreeFullLabelSlotProps) => VNode[];
    }>();

    const found = useTreeContext();

    if (!found) {
        throw new Error('A tree row renders only inside Tree or TreeSelect');
    }

    const context = found;
    const prefix = cssClasses.PREFIX_OPTION;

    // same rule as the foundation's #isDisabled: a disabled tree wins over a node's own disabled: false
    const isDisabled = () => Boolean(context.view.value.treeDisabled || props.row.disabled);

    const isLeaf = () => isTreeNodeLeaf(props.row, context.view.value.hasLoadData);

    // Stable handler identity: the same function given to a slot and bound again by the row merges into one listener
    const onSelect = (event: MouseEvent) => context.onNodeSelect(event, props.row);

    const onExpand = (event: MouseEvent) => {
        event.stopPropagation();
        context.onNodeExpand(event, props.row);
    };

    const onCheck = (event: MouseEvent) => {
        if (isDisabled()) {
            return;
        }
        event.stopPropagation();
        context.onNodeCheck(event, props.row);
    };

    const onContextmenu = (event: MouseEvent) => context.onNodeRightClick?.(event, props.row);

    // a double-click expands, so the clicks right after the first do not select again
    const debouncedSelect = debounce((select: () => void) => select(), 500, { edges: ['leading'] });

    const onClick = (event: MouseEvent) => {
        if (context.view.value.expandAction === 'doubleClick') {
            debouncedSelect(() => onSelect(event));
            return;
        }
        onSelect(event);
        if (context.view.value.expandAction === 'click') {
            onExpand(event);
        }
    };

    const onDblclick = (event: MouseEvent) => {
        event.stopPropagation();
        context.onNodeDoubleClick?.(event, props.row);
        if (context.view.value.expandAction === 'doubleClick') {
            onExpand(event);
        }
    };

    // the foundation reads the row element from nodeInstance, to place the drop and to build the drag image
    const withInstance = (event: DragEvent): TreeRowProps => ({ ...props.row, nodeInstance: event.currentTarget });

    const onDragstart = (event: DragEvent) => {
        event.stopPropagation();
        context.onNodeDragStart?.(event, withInstance(event));
    };

    const onDragenter = (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        context.onNodeDragEnter?.(event, withInstance(event));
    };

    const onDragover = (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        context.onNodeDragOver?.(event, withInstance(event));
    };

    const onDragleave = (event: DragEvent) => {
        event.stopPropagation();
        context.onNodeDragLeave?.(event, withInstance(event));
    };

    const onDragend = (event: DragEvent) => {
        event.stopPropagation();
        context.onNodeDragEnd?.(event, withInstance(event));
    };

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        context.onNodeDrop?.(event, withInstance(event));
    };

    const rowFlags = (): TreeRowFlags => {
        const { draggable, labelEllipsis, dragOverNodeKey, dropPosition } = context.view.value;
        return { disabled: isDisabled(), focused: props.focused, draggable, labelEllipsis, fullLabel: Boolean(slots.fullLabel), dragOverNodeKey, dropPosition };
    };

    const nodeClass = () => getTreeRowClassMap(props.row, rowFlags());

    const labelClass = () => getTreeLabelClassMap(props.row, rowFlags());

    const rowAttrs = () => {
        const { row } = props;
        const { multiple, draggable } = context.view.value;
        const disabled = isDisabled();
        return {
            id: props.id,
            ...getTreeRowAria(row, { disabled, isLeaf: isLeaf(), multiple }),
            'data-key': row.eventKey,
            ...(draggable
                ? {
                      draggable: !disabled || undefined,
                      onDragstart,
                      onDragenter,
                      onDragover,
                      onDragleave,
                      onDrop,
                      onDragend,
                  }
                : {}),
        };
    };

    const iconSlotProps = (): TreeIconSlotProps => {
        const { row } = props;
        return {
            item: row.data,
            level: row.level,
            expanded: Boolean(row.expanded),
            isLeaf: isLeaf(),
            loading: Boolean(row.loading),
            selected: Boolean(row.selected),
            checked: Boolean(row.checked),
            halfChecked: Boolean(row.halfChecked),
        };
    };

    const iconNodes = (): KeyedNode[] | null => {
        if (!slots.icon) {
            return null;
        }
        const nodes = slots.icon(iconSlotProps());
        return hasSlotContent(() => nodes) ? slotNodes(nodes) : null;
    };

    const highlighted = () => Boolean(props.row.filtered && props.row.keyword && props.row.label !== undefined);

    const fullLabelProps = (): TreeFullLabelSlotProps => {
        const { row } = props;
        return {
            data: row.data,
            level: row.level,
            class: normalizeClass(nodeClass()),
            expandIcon: h(NodeArrow, { row, showLine: props.showLine, onExpand }, slots.expandIcon ? { expandIcon: slots.expandIcon } : undefined),
            checkStatus: { checked: Boolean(row.checked), halfChecked: Boolean(row.halfChecked) },
            expandStatus: { expanded: Boolean(row.expanded), loading: Boolean(row.loading) },
            filtered: row.filtered,
            searchWord: row.keyword,
            onClick,
            onCheck,
            onExpand,
            onContextmenu,
            onDblclick,
        };
    };

    onBeforeUnmount(() => debouncedSelect.cancel());
</script>

<template>
    <li v-if="$slots.fullLabel" v-bind="rowAttrs()" role="treeitem" :style="props.rowStyle">
        <slot name="fullLabel" v-bind="fullLabelProps()" />
    </li>
    <li v-else v-bind="rowAttrs()" :class="nodeClass()" role="treeitem" :style="props.rowStyle" @click="onClick" @contextmenu="onContextmenu" @dblclick="onDblclick">
        <span aria-hidden="true" :class="[`${prefix}-indent`, { [`${prefix}-indent-show-line`]: props.showLine }]">
            <span v-for="i in props.row.level" :key="i" :class="[`${prefix}-indent-unit`, { [`${prefix}-indent-unit-end`]: props.row.isEnd[i - 1] }]" />
        </span>
        <NodeArrow :row="props.row" :showLine="props.showLine" @expand="onExpand">
            <template v-if="$slots.expandIcon" #expandIcon="arrowProps">
                <slot name="expandIcon" v-bind="arrowProps" />
            </template>
        </NodeArrow>
        <span :class="labelClass()">
            <div v-if="context.view.value.multiple" role="none" @click="onCheck">
                <Checkbox aria-hidden="true" :disabled="isDisabled()" :indeterminate="Boolean(props.row.halfChecked)" :modelValue="Boolean(props.row.checked)" :tabindex="-1" />
            </div>
            <template v-for="(nodes, i) in [iconNodes()]" :key="i">
                <template v-if="nodes">
                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                </template>
                <template v-else-if="context.view.value.directory">
                    <IconFile v-if="isLeaf()" :class="`${prefix}-item-icon`" />
                    <IconFolderOpen v-else-if="props.row.expanded" :class="`${prefix}-item-icon`" />
                    <IconFolder v-else :class="`${prefix}-item-icon`" />
                </template>
            </template>
            <span :class="`${prefix}-label-text`">
                <slot v-if="$slots.label" :item="props.row.data" :label="props.row.label" name="label" :searchWord="props.row.keyword" />
                <Highlight v-else-if="highlighted()" component="span" :highlightClassName="`${prefix}-highlight`" :searchWords="[props.row.keyword]" :sourceString="String(props.row.label)" />
                <template v-else>{{ props.row.label }}</template>
            </span>
        </span>
    </li>
</template>
