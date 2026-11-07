<script setup lang="ts">
    import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
    import { Sortable, SortableHandle, type SortEndPayload } from '../..';

    const props = withDefaults(defineProps<{ items?: (string | number)[] }>(), { items: () => ['a', 'b', 'c'] });
    const emit = defineEmits<{ sortEnd: [payload: SortEndPayload] }>();
</script>

<template>
    <Sortable aria-label="list" class="list" :dragHandleLabel="zh_CN.Transfer.dragSort" dragOverlayClass="overlay" :items="props.items" role="list" style="overflow: auto" tabindex="0" @sortEnd="emit('sortEnd', $event)">
        <template #item="{ id, index }">
            <div :data-index="index" style="height: 30px">
                <SortableHandle><span style="display: inline-block; height: 20px">drag</span></SortableHandle>
                <span>{{ id }}</span>
            </div>
        </template>
    </Sortable>
</template>
