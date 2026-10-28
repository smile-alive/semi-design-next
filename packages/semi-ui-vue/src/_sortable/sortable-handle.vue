<script setup lang="ts">
    import { onBeforeUnmount, onMounted, useTemplateRef, type VNode } from 'vue';
    import { useSortableItemContext } from './context';

    defineSlots<{ default?: () => VNode[] }>();

    // The copy that follows the pointer is rendered outside any item, so it shows the handle content without a second
    // focusable handle. Known limit: an item registers one handle, so a second SortableHandle in the same item takes over
    // from the first; TagInput and Transfer use one per item.
    const context = useSortableItemContext();

    const button = useTemplateRef('button');

    onMounted(() => context?.setHandle(button.value));
    onBeforeUnmount(() => context?.setHandle(null));
</script>

<template>
    <!--
        dnd-kit starts a drag from the handle with both pointer and keyboard, so the handle is a native button; its
        accessibility plugin adds aria-describedby and aria-pressed. The mousedown must not reach a popup layer, which
        would close when the pressed element goes away.
    -->
    <button v-if="context" ref="button" :aria-label="context.view.value.label" :aria-roledescription="context.view.value.roleDescription" :class="`${context.view.value.prefix}-sortable-handle`" type="button" @mousedown.prevent.stop>
        <slot />
    </button>
    <slot v-else />
</template>
