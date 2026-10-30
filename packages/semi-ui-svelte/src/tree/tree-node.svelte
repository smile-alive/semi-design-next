<script lang="ts">
    import { onDestroy } from 'svelte';
    import { debounce } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/tree/constants';
    import { getTreeLabelClassMap, getTreeRowAria, getTreeRowClassMap, isTreeNodeLeaf, type TreeRowFlags } from '@fibrae/semi-foundation/tree/shared';
    import { IconFile, IconFolder, IconFolderOpen } from '@fibrae/semi-icons-svelte';
    import Checkbox from '../checkbox/checkbox.svelte';
    import Highlight from '../highlight/highlight.svelte';
    import { getTreeContext } from './context.js';
    import type { TreeFullLabelSnippetProps, TreeNodeProps, TreeRowProps } from './interface.js';
    import NodeArrow from './node-arrow.svelte';

    /**
     * One row of the tree. The row takes no focus: the tree keeps it and points at the row with aria-activedescendant
     * (`id`, `focused`), so the keys are handled by the tree, and the arrow and the checkbox inside are only pictures of
     * the row's state. Every interaction reports the whole `row` to the tree through the context.
     */
    let { row, id, focused = false, showLine = false, rowStyle, label, icon, expandIcon, fullLabel }: TreeNodeProps = $props();

    const context = getTreeContext('A tree row');

    const prefix = cssClasses.PREFIX_OPTION;

    // same rule as the foundation's #isDisabled: a disabled tree wins over a node's own disabled: false
    const disabled = $derived(Boolean(context.treeDisabled || row.disabled));
    const isLeaf = $derived(isTreeNodeLeaf(row, context.hasLoadData));

    const rowFlags = $derived<TreeRowFlags>({
        disabled,
        focused,
        draggable: context.draggable,
        labelEllipsis: context.labelEllipsis,
        fullLabel: Boolean(fullLabel),
        dragOverNodeKey: context.dragOverNodeKey,
        dropPosition: context.dropPosition,
    });

    const nodeClass = $derived(getTreeRowClassMap(row, rowFlags));
    const labelClass = $derived(getTreeLabelClassMap(row, rowFlags));
    const aria = $derived(getTreeRowAria(row, { disabled, isLeaf, multiple: context.multiple }));
    const draggable = $derived(context.draggable && !disabled ? true : undefined);
    const highlighted = $derived(Boolean(row.filtered && row.keyword && row.label !== undefined));

    // a double-click expands, so the clicks right after the first do not select again
    const debouncedSelect = debounce((select: () => void) => select(), 500, { edges: ['leading'] });

    const onSelect = (event: MouseEvent) => context.onNodeSelect(event, row);

    const onExpand = (event: MouseEvent) => {
        event.stopPropagation();
        context.onNodeExpand(event, row);
    };

    const onCheck = (event: MouseEvent) => {
        if (disabled) {
            return;
        }
        event.stopPropagation();
        context.onNodeCheck(event, row);
    };

    const onContextmenu = (event: MouseEvent) => context.onNodeRightClick?.(event, row);

    const onClick = (event: MouseEvent) => {
        if (context.expandAction === 'doubleClick') {
            debouncedSelect(() => onSelect(event));
            return;
        }
        onSelect(event);
        if (context.expandAction === 'click') {
            onExpand(event);
        }
    };

    const onDblclick = (event: MouseEvent) => {
        event.stopPropagation();
        context.onNodeDoubleClick?.(event, row);
        if (context.expandAction === 'doubleClick') {
            onExpand(event);
        }
    };

    // the foundation reads the row element from nodeInstance, to place the drop and to build the drag image
    const withInstance = (event: DragEvent): TreeRowProps => ({ ...row, nodeInstance: event.currentTarget });

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

    const classString = (map: Record<string, boolean | undefined>) =>
        Object.keys(map)
            .filter((name) => map[name])
            .join(' ');

    const fullLabelProps = (): TreeFullLabelSnippetProps => ({
        data: row.data,
        level: row.level,
        class: classString(nodeClass),
        expandIcon: arrow,
        checkStatus: { checked: Boolean(row.checked), halfChecked: Boolean(row.halfChecked) },
        expandStatus: { expanded: Boolean(row.expanded), loading: Boolean(row.loading) },
        filtered: row.filtered,
        searchWord: row.keyword,
        onClick,
        onCheck,
        onExpand,
        onContextmenu,
        onDblclick,
    });

    onDestroy(() => debouncedSelect.cancel());
</script>

{#snippet arrow()}
    <NodeArrow {expandIcon} {onExpand} {row} {showLine} />
{/snippet}

{#if fullLabel}
    <li
        {...aria}
        data-key={row.eventKey}
        {draggable}
        {id}
        role="treeitem"
        style={rowStyle}
        ondragend={context.draggable ? onDragend : undefined}
        ondragenter={context.draggable ? onDragenter : undefined}
        ondragleave={context.draggable ? onDragleave : undefined}
        ondragover={context.draggable ? onDragover : undefined}
        ondragstart={context.draggable ? onDragstart : undefined}
        ondrop={context.draggable ? onDrop : undefined}
    >
        {@render fullLabel(fullLabelProps())}
    </li>
{:else}
    <li
        {...aria}
        class={nodeClass}
        data-key={row.eventKey}
        {draggable}
        {id}
        role="treeitem"
        style={rowStyle}
        onclick={onClick}
        oncontextmenu={onContextmenu}
        ondblclick={onDblclick}
        ondragend={context.draggable ? onDragend : undefined}
        ondragenter={context.draggable ? onDragenter : undefined}
        ondragleave={context.draggable ? onDragleave : undefined}
        ondragover={context.draggable ? onDragover : undefined}
        ondragstart={context.draggable ? onDragstart : undefined}
        ondrop={context.draggable ? onDrop : undefined}
    >
        <span aria-hidden="true" class={[`${prefix}-indent`, { [`${prefix}-indent-show-line`]: showLine }]}>
            {#each { length: row.level }, i (i)}
                <span class={[`${prefix}-indent-unit`, { [`${prefix}-indent-unit-end`]: row.isEnd[i] }]}></span>
            {/each}
        </span>
        <NodeArrow {expandIcon} {onExpand} {row} {showLine} />
        <span class={labelClass}>
            {#if context.multiple}
                <div role="none" onclick={onCheck}>
                    <Checkbox aria-hidden="true" bind:checked={() => Boolean(row.checked), () => {}} {disabled} indeterminate={Boolean(row.halfChecked)} tabindex={-1} />
                </div>
            {/if}
            {#if icon}
                {@render icon({ item: row.data, level: row.level, expanded: Boolean(row.expanded), isLeaf, loading: Boolean(row.loading), selected: Boolean(row.selected), checked: Boolean(row.checked), halfChecked: Boolean(row.halfChecked) })}
            {:else if context.directory}
                {#if isLeaf}
                    <IconFile class="{prefix}-item-icon" />
                {:else if row.expanded}
                    <IconFolderOpen class="{prefix}-item-icon" />
                {:else}
                    <IconFolder class="{prefix}-item-icon" />
                {/if}
            {/if}
            <span class="{prefix}-label-text">
                {#if label}
                    {@render label({ item: row.data, label: row.label, searchWord: row.keyword })}
                {:else if highlighted}
                    <Highlight component="span" highlightClassName="{prefix}-highlight" searchWords={[row.keyword]} sourceString={String(row.label)} />
                {:else}
                    {row.label}
                {/if}
            </span>
        </span>
    </li>
{/if}
