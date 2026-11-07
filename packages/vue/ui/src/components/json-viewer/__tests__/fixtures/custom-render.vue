<script setup lang="ts">
    import JsonViewer, { type JsonViewerOptions } from '../..';

    const options: JsonViewerOptions = {
        readOnly: true,
        customRenderRule: [{ name: 'name', match: 'Semi' }, { match: (value) => value === 5 }],
    };
</script>

<template>
    <JsonViewer modelValue="1" :options="options">
        <template #customRender="{ item, index, content }">
            <b :data-index="index" :data-name="item.name">{{ content }}</b>
        </template>
    </JsonViewer>
</template>
