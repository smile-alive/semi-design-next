<script setup lang="ts">
    import { ref } from 'vue';
    import PinCode from '../..';

    const props = withDefaults(defineProps<{ initial?: string; count?: number; writeBack?: boolean }>(), {
        initial: '',
        count: undefined,
        writeBack: true,
    });
    const value = ref(props.initial);
    const onChange = (next: string) => {
        if (props.writeBack) value.value = next;
    };
</script>

<template>
    <PinCode :count="props.count" :modelValue="value" @change="onChange" />
    <span data-testid="value">{{ value }}</span>
</template>
