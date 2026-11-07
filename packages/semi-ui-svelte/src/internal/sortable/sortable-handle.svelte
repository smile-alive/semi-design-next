<script lang="ts">
    import { getSortableItemContext } from './context.js';
    import type { SortableHandleProps } from './interface.js';

    let { children }: SortableHandleProps = $props();

    // The copy that follows the pointer is rendered outside any item, so it shows the handle content without a second
    // focusable handle. Known limit: an item registers one handle, so a second SortableHandle in the same item takes over
    // from the first; TagInput and Transfer use one per item.
    const context = getSortableItemContext();

    // The mousedown must not reach a popup layer, which would close when the pressed element goes away
    const stopMouseDown = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };
</script>

<!-- dnd-kit starts a drag from the handle with both pointer and keyboard, so the handle is a native button; its accessibility plugin adds aria-describedby and aria-pressed -->
{#if context}
    <button {@attach context.attachHandle} aria-label={context.label} aria-roledescription={context.roleDescription} class={`${context.prefix}-sortable-handle`} type="button" onmousedown={stopMouseDown}>
        {@render children?.()}
    </button>
{:else}
    {@render children?.()}
{/if}
