<script setup lang="ts">
    import { ref } from 'vue';
    import { ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-vue';

    const text = ref('Drag to resize');
    const itemStyle = {
        backgroundColor: 'var(--semi-grey-1)',
        border: 'var(--semi-color-border) 1px solid',
    };
</script>

<template>
    <div :style="{ width: '1000px', height: '100px' }">
        <ResizeGroup direction="horizontal">
            <ResizeItem defaultSize="400px" min="10%" :style="itemStyle" @change="text = 'resizing'" @resizeEnd="text = 'Drag to resize'">
                <div :style="{ marginLeft: '20%' }">{{ text + ' min:10%' }}</div>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem defaultSize="20%" max="30%" min="10%" :style="itemStyle" @change="text = 'resizing'">
                <div :style="{ marginLeft: '20%' }">{{ text + ' min:10% max:30%' }}</div>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem defaultSize="0.5" :style="itemStyle" @change="text = 'resizing'">
                <div :style="{ marginLeft: '20%' }">{{ text }}</div>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem :defaultSize="1" :style="itemStyle" @change="text = 'resizing'">
                <div :style="{ marginLeft: '20%' }">{{ text }}</div>
            </ResizeItem>
        </ResizeGroup>
    </div>
</template>
