<script setup lang="ts">
    import JsonViewer, { type JsonViewerOptions } from '../..';
    import Popover from '../../../popover';
    import Rating from '../../../rating';

    defineProps<{ value: string }>();

    const options: JsonViewerOptions = {
        readOnly: true,
        customRenderRule: [
            { name: 'name', match: 'Mark' },
            { name: 'age', match: (value, path) => typeof value === 'number' && path.endsWith('.age') },
        ],
    };
</script>

<template>
    <JsonViewer :height="200" :modelValue="value" :options="options" :width="700">
        <template #customRender="{ item, content }">
            <Popover v-if="item.name === 'name'" trigger="click">
                <span class="name-token">{{ content }}</span>
                <template #content>Mark details</template>
            </Popover>
            <Rating v-else class="age-token" :defaultValue="Number(content)" disabled size="small" />
        </template>
    </JsonViewer>
</template>
