<script setup lang="ts">
    import { JsonViewer } from '@fibrae/semi-ui-vue';

    const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;
    const wrapperStyle = { marginBottom: '12px', overflow: 'hidden' };
</script>

<template>
    <div>
        <div :style="wrapperStyle">
            <JsonViewer :height="100" :modelValue="data" :options="{ lineHeight: 20 }" :width="700" />
        </div>
        <div :style="wrapperStyle">
            <JsonViewer :height="120" :modelValue="data" :options="{ lineHeight: 24 }" :width="700" />
        </div>
        <div :style="wrapperStyle">
            <JsonViewer :height="120" :modelValue="data" :options="{ lineHeight: 26 }" :width="700" />
        </div>
    </div>
</template>
