<script setup lang="ts">
    import JsonViewer from '../..';
</script>

<template>
    <JsonViewer modelValue="1" :options="{ readOnly: true, customRenderRule: [{ match: 'Semi' }] }">
        <template #customRender />
    </JsonViewer>
</template>
