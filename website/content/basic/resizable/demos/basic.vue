<script setup lang="ts">
    import { ref } from 'vue';
    import { Resizable, Toast } from '@fibrae/semi-ui-vue';

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

    const text = ref('Drag edge to resize');

    // Declared here, not inline: an inline call returns the toast id, which ResizeStartCallback rejects
    const onResizeStart = () => {
        Toast.info(opts_1);
    };
</script>

<template>
    <div :style="{ width: '500px' }">
        <Resizable
            :defaultSize="{ width: '60%', height: 300 }"
            :style="{ backgroundColor: 'var(--semi-grey-1)' }"
            @change="text = 'resizing'"
            @resizeEnd="
                Toast.info(opts_2);
                text = 'Drag edge to resize';
            "
            @resizeStart="onResizeStart"
        >
            <div :style="{ marginInlineStart: '20%' }">{{ text }}</div>
        </Resizable>
    </div>
</template>
