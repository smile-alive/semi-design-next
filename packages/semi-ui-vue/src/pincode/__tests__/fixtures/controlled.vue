<script setup lang="ts">
    import { ref } from 'vue';
    import PinCode from '../..';

    const props = defineProps<{
        initial?: string;
        count?: number;
        onChange?: (value: string) => void;
        onComplete?: (value: string) => void;
    }>();
    const value = ref(props.initial ?? '');
</script>

<template>
    <PinCode v-model="value" :count="props.count" @change="props.onChange?.($event)" @complete="props.onComplete?.($event)" />
    <span data-testid="value">{{ value }}</span>
</template>
