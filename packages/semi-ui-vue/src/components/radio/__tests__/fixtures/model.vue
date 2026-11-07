<script setup lang="ts">
    import { ref } from 'vue';
    import Radio from '../..';
    import type { RadioChangeEvent } from '../../interface';

    const emit = defineEmits<{ change: [event: RadioChangeEvent] }>();
    const checked = ref<boolean | undefined>(true);
</script>

<template>
    <Radio v-model="checked" mode="advanced" @change="emit('change', $event)">111</Radio>
    <button type="button" @click="checked = undefined">reset</button>
    <output aria-label="model">{{ String(checked) }}</output>
</template>
