<script setup lang="ts">
    import { JsonViewer } from '@fibrae/semi-ui-vue';

    const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;
</script>

<template>
    <div :style="{ marginBottom: '16px' }">
        <JsonViewer :height="100" :modelValue="data" :width="700" />
    </div>
</template>
