<script setup lang="ts">
    import { ref } from 'vue';
    import { ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-vue';

    const text = ref('Drag to resize');
    const itemStyle = {
        backgroundColor: 'var(--semi-grey-1)',
        border: 'var(--semi-color-border) 1px solid',
    };
    const borderStyle = { border: 'var(--semi-color-border) 1px solid' };
</script>

<template>
    <div :style="{ width: '1000px', height: '600px' }">
        <ResizeGroup direction="vertical">
            <ResizeItem defaultSize="80%">
                <ResizeGroup direction="horizontal">
                    <ResizeItem defaultSize="25%" max="30%" min="10%" :style="itemStyle">
                        <div :style="{ marginLeft: '20%' }">{{ text + ' min:10% max:30%' }}</div>
                    </ResizeItem>
                    <ResizeHandler />
                    <ResizeItem defaultSize="50%" :style="borderStyle">
                        <div :style="{ height: '100%' }">
                            <ResizeGroup direction="vertical">
                                <ResizeItem defaultSize="33%" min="10%" :style="itemStyle" @change="text = 'resizing'" @resizeEnd="text = 'Drag to resize'">
                                    <div :style="{ marginLeft: '20%' }">{{ text + ' min:10%' }}</div>
                                </ResizeItem>
                                <ResizeHandler />
                                <ResizeItem defaultSize="33%" max="40%" min="10%" :style="itemStyle">
                                    <div :style="{ marginLeft: '20%' }">{{ text + ' min:10% max:40%' }}</div>
                                </ResizeItem>
                                <ResizeHandler />
                                <ResizeItem :style="itemStyle">
                                    <div :style="{ marginLeft: '20%' }">{{ text }}</div>
                                </ResizeItem>
                            </ResizeGroup>
                        </div>
                    </ResizeItem>
                    <ResizeHandler />
                    <ResizeItem defaultSize="1" max="30%" :style="itemStyle">
                        <div :style="{ marginLeft: '20%' }">{{ text + ' max:30%' }}</div>
                    </ResizeItem>
                </ResizeGroup>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem defaultSize="20%" @change="text = 'resizing'">
                <ResizeGroup direction="horizontal">
                    <ResizeItem defaultSize="50%" :style="itemStyle">
                        <div :style="{ marginLeft: '20%' }">tab</div>
                    </ResizeItem>
                    <ResizeHandler />
                    <ResizeItem defaultSize="50%" :style="itemStyle">
                        <div :style="{ marginLeft: '20%' }">content</div>
                    </ResizeItem>
                </ResizeGroup>
            </ResizeItem>
        </ResizeGroup>
    </div>
</template>
