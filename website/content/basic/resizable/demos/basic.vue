<script setup lang="ts">
    import { ref } from 'vue';
    import { Resizable, Toast } from '@fibrae/semi-ui-vue';

    const text = ref('Drag edge to resize');
    const opts_1 = {
        content: 'resize start',
        duration: 1,
        stack: true,
    };
    const opts_2 = {
        content: 'resize end',
        duration: 1,
        stack: true,
    };

    const onResizeStart = () => {
        Toast.info(opts_1);
    };

    const onResizeEnd = () => {
        Toast.info(opts_2);
        text.value = 'Drag edge to resize';
    };
</script>

<template>
    <div :style="{ width: '500px' }">
        <Resizable :defaultSize="{ width: '60%', height: 300 }" :style="{ backgroundColor: 'var(--semi-grey-1)' }" @change="text = 'resizing'" @resizeEnd="onResizeEnd" @resizeStart="onResizeStart">
            <div :style="{ marginLeft: '20%' }">{{ text }}</div>
        </Resizable>
    </div>
</template>
