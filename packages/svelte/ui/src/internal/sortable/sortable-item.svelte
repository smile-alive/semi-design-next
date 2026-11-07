<script lang="ts">
    import type { Snippet } from 'svelte';
    import { createSortable } from '@dnd-kit/svelte/sortable';
    import { setSortableItemContext } from './context.js';
    import type { SortableTransition } from './interface.js';

    let {
        id,
        index,
        prefix,
        label,
        roleDescription,
        transition,
        children,
    }: {
        id: string | number;
        index: number;
        prefix: string;
        label: string;
        roleDescription: string;
        transition?: SortableTransition;
        children?: Snippet;
    } = $props();

    const sortable = createSortable({
        get id() {
            return id;
        },
        get index() {
            return index;
        },
        get transition() {
            return transition;
        },
    });

    setSortableItemContext({
        get label() {
            return label;
        },
        get roleDescription() {
            return roleDescription;
        },
        get prefix() {
            return prefix;
        },
        attachHandle: sortable.attachHandle,
    });
</script>

<div {@attach sortable.attach} class={[`${prefix}-sortable-item`, { [`${prefix}-sortable-item-over`]: sortable.isDropTarget, [`${prefix}-sortable-item-active`]: sortable.isDragSource }]}>
    {@render children?.()}
</div>
