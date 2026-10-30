<script setup lang="ts">
    import { ref } from 'vue';
    import { ResizeGroup, ResizeHandler, ResizeItem, Toast } from '@fibrae/semi-ui-vue';

    const text = ref('Drag to resize');
    const opts_1 = {
        content: 'resize start',
        duration: 1,
        stack: true,
    };
    const opts = {
        content: 'resize end',
        duration: 1,
        stack: true,
    };
    const itemStyle = {
        backgroundColor: 'var(--semi-grey-1)',
        border: 'var(--semi-color-border) 1px solid',
    };

    const onResizeStart = () => {
        Toast.info(opts_1);
    };

    const onResizeEnd = () => {
        Toast.info(opts);
        text.value = 'Drag to resize';
    };
</script>

<template>
    <div :style="{ width: '1000px', height: '600px' }">
        <ResizeGroup direction="vertical">
            <ResizeItem defaultSize="20%" :style="{ backgroundColor: 'var(--semi-grey-1)' }" @change="text = 'resizing'" @resizeEnd="onResizeEnd" @resizeStart="onResizeStart">
                <div :style="{ marginLeft: '20%' }">header</div>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem defaultSize="80%" @change="text = 'resizing'">
                <ResizeGroup direction="horizontal">
                    <ResizeItem defaultSize="25%" :style="itemStyle" @change="text = 'resizing'" @resizeEnd="onResizeEnd" @resizeStart="onResizeStart">
                        <div :style="{ marginLeft: '20%' }">tab</div>
                    </ResizeItem>
                    <ResizeHandler />
                    <ResizeItem defaultSize="75%" :style="itemStyle" @change="text = 'resizing'">
                        <div :style="{ marginLeft: '20%' }">{{ text }}</div>
                    </ResizeItem>
                </ResizeGroup>
            </ResizeItem>
        </ResizeGroup>
    </div>
</template>
