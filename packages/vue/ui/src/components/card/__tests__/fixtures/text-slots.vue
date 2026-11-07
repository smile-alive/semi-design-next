<script setup lang="ts">
    import Card from '../..';

    const props = withDefaults(defineProps<{ value?: number }>(), { value: 0 });
</script>

<template>
    <Card>
        <template #title>{{ props.value }}</template>
        <template #footer>{{ props.value }}</template>
        {{ props.value }}
    </Card>
</template>
