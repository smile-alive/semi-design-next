<script setup lang="ts">
    import { ref } from 'vue';
    import Checkbox from '../..';
    import type { CheckboxEvent } from '../../interface';

    const emit = defineEmits<{ change: [event: CheckboxEvent] }>();
    const checked = ref<boolean | undefined>(false);
</script>

<template>
    <Checkbox v-model="checked" @change="emit('change', $event)">label</Checkbox>
    <button type="button" @click="checked = true">check</button>
    <button type="button" @click="checked = undefined">reset</button>
    <output aria-label="model">{{ String(checked) }}</output>
</template>
