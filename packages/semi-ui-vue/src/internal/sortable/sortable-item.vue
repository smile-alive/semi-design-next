<script setup lang="ts">
    import { computed, shallowRef, useTemplateRef, type VNode } from 'vue';
    import { useSortable } from '@dnd-kit/vue/sortable';
    import { provideSortableItemContext } from './context';
    import type { SortableTransition } from './interface';

    const props = withDefaults(
        defineProps<{
            id: string | number;
            index: number;
            prefix: string;
            label: string;
            roleDescription: string;
            transition?: SortableTransition;
        }>(),
        { transition: undefined }
    );

    defineSlots<{ default?: () => VNode[] }>();

    const item = useTemplateRef('item');
    const handle = shallowRef<HTMLElement | null>(null);

    const { isDragSource, isDropTarget } = useSortable({
        id: () => props.id,
        index: () => props.index,
        transition: () => props.transition,
        element: item,
        handle,
    });

    provideSortableItemContext({
        view: computed(() => ({ label: props.label, roleDescription: props.roleDescription, prefix: props.prefix })),
        setHandle: (element) => {
            handle.value = element;
        },
    });
</script>

<template>
    <div
        ref="item"
        :class="[
            `${props.prefix}-sortable-item`,
            {
                [`${props.prefix}-sortable-item-over`]: isDropTarget,
                [`${props.prefix}-sortable-item-active`]: isDragSource,
            },
        ]"
    >
        <slot />
    </div>
</template>
