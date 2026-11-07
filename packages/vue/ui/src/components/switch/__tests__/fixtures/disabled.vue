<script setup lang="ts">
    import Switch from '../..';
    const emit = defineEmits<{ change: [checked: boolean, event: Event] }>();
</script>

<template>
    <Switch aria-label="off limits" disabled @change="(checked, event) => emit('change', checked, event)" />
    <button type="button">next</button>
</template>
