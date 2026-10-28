<script setup lang="ts">
    import { ref } from 'vue';
    import ScrollList, { ScrollItem } from '../..';

    const props = withDefaults(defineProps<{ cycled?: boolean; initial?: number; label?: string; mode?: 'normal' | 'wheel'; motion?: boolean }>(), { cycled: false, initial: 1, label: '1', mode: 'normal', motion: true });
    const emit = defineEmits<{ select: [value: number] }>();
    const list = Array.from({ length: 20 }, (_, index) => ({ value: index }));
    const selectedIndex = ref(props.initial);
</script>

<template>
    <ScrollList header="hello world">
        <ScrollItem v-model:selectedIndex="selectedIndex" :aria-label="props.label" :cycled="props.cycled" :list="list" :mode="props.mode" :motion="props.motion" @select="emit('select', $event.value)" />
    </ScrollList>
</template>
