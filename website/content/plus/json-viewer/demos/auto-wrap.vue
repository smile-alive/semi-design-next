<script setup lang="ts">
    import { JsonViewer } from '@fibrae/semi-ui-vue';

    const data = `{
    "name": "Semi",
    "version": "0.0.0",
    "description": "Semi Design is a design system that defines a set of mid_back design and front_end basic components."
}`;
    const options = { autoWrap: true };
</script>

<template>
    <div :style="{ marginBottom: '16px' }">
        <JsonViewer :height="120" :modelValue="data" :options="options" :width="700" />
    </div>
</template>
