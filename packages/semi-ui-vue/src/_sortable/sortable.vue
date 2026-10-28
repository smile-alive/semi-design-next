<script setup lang="ts">
    import { nextTick, shallowRef, watch } from 'vue';
    import { DragDropProvider, DragOverlay, type DragDropProviderProps, type DragEndEvent } from '@dnd-kit/vue';
    import { isSortable } from '@dnd-kit/vue/sortable';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { SortableAnnouncer } from '@fibrae/semi-foundation/sortable/accessibility';
    import useLocale from '../locale/use-locale';
    import type { SortableEmits, SortableProps, SortableSlots } from './interface';
    import SortableItem from './sortable-item.vue';

    // The rendered root is a fragment of the list and the drag overlay, so attrs (Transfer's role, name and style) are
    // bound to the list. The two stay siblings: the stylesheet finds the active item through `:has(~ [data-dnd-overlay])`.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<SortableProps>(), {
        prefix: `${BASE_CLASS_PREFIX}-sortable`,
        transition: undefined,
        dragOverlayClass: undefined,
    });

    const emit = defineEmits<SortableEmits>();
    defineSlots<SortableSlots>();

    const locale = useLocale('Sortable');

    // the announcements run at drag time and read the latest locale and item count
    const announcer = new SortableAnnouncer(locale.value.locale, props.items.length);

    // dnd-kit has already moved the dropped item's element; when the parent keeps the old order (a controlled value that
    // declines the sort), Vue sees no change to patch, so the list is rebuilt to put the elements back
    const listKey = shallowRef(0);

    const plugins: DragDropProviderProps['plugins'] = (defaults) => [...defaults, announcer.plugin];

    const onDragEnd = (event: DragEndEvent) => {
        emit('dragging', false);
        const { source } = event.operation;
        if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
            return;
        }
        const before = [...props.items];
        emit('sortEnd', { oldIndex: source.initialIndex, newIndex: source.index });
        // Known limit: a parent that accepts the sort after more than one tick is rebuilt here too, which drops the focus
        // its handle had; upgrade to a dnd-kit API that restores the order if one is exposed
        void nextTick().then(() => {
            if (props.items.every((id, index) => id === before[index])) {
                listKey.value += 1;
            }
        });
    };

    watch([() => locale.value.locale, () => props.items.length], ([sortableLocale, total]) => announcer.update(sortableLocale, total), { flush: 'sync' });
</script>

<template>
    <DragDropProvider :plugins="plugins" @dragEnd="onDragEnd" @dragStart="emit('dragging', true)">
        <div :key="listKey" v-bind="$attrs">
            <SortableItem v-for="(id, index) in props.items" :id="id" :key="id" :index="index" :label="props.dragHandleLabel" :prefix="props.prefix" :roleDescription="locale.locale.roleDescription" :transition="props.transition">
                <slot :id="id" :index="index" name="item" />
            </SortableItem>
        </div>
        <!-- dnd-kit shows the overlay in the top layer, above any open popup -->
        <DragOverlay :class="props.dragOverlayClass">
            <template #default="{ source }">
                <slot :id="source.id" :index="props.items.indexOf(source.id)" name="item" />
            </template>
        </DragOverlay>
    </DragDropProvider>
</template>
