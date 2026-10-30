<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-vue';

    const text = ref('drag to resize');
    const direction = ref<'horizontal' | 'vertical'>('horizontal');
    const itemStyle = { backgroundColor: 'var(--semi-grey-1)' };
    const contentStyle = { marginLeft: '20%', padding: '5px' };

    const changeDirection = () => {
        direction.value = direction.value === 'horizontal' ? 'vertical' : 'horizontal';
    };
</script>

<template>
    <div :style="{ width: '400px', height: '300px' }">
        <Button @click="changeDirection">{{ direction }}</Button>
        <ResizeGroup :direction="direction">
            <ResizeItem :defaultSize="5" @change="text = 'resizing'" @resizeEnd="text = 'drag to resize'">
                <ResizeGroup direction="horizontal">
                    <ResizeItem :style="itemStyle" @change="text = 'resizing'" @resizeEnd="text = 'drag to resize'">
                        <div :style="contentStyle">{{ text }}</div>
                    </ResizeItem>
                    <ResizeHandler />
                    <ResizeItem :style="itemStyle" @change="text = 'resizing'">
                        <div :style="contentStyle">{{ text }}</div>
                    </ResizeItem>
                </ResizeGroup>
            </ResizeItem>
            <ResizeHandler />
            <ResizeItem :defaultSize="1.3" :style="itemStyle" @change="text = 'resizing'">
                <div :style="contentStyle">{{ text }}</div>
            </ResizeItem>
        </ResizeGroup>
    </div>
</template>
