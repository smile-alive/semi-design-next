<script setup lang="ts">
    import { ref } from 'vue';
    import { Resizable, type Size } from '../..';

    const props = defineProps<{ mode: 'two-way' | 'width' }>();
    const size = ref<Size>({ width: 200, height: 100 });
    const width = ref(200);
</script>

<template>
    <Resizable v-if="props.mode === 'two-way'" v-model:size="size" />
    <Resizable v-else :defaultSize="{ height: 100 }" :size="{ width }" @change="width = Number($event.width)" />
    <output aria-label="size">{{ props.mode === 'two-way' ? `${size.width}x${size.height}` : width }}</output>
</template>
