<script setup lang="ts">
    import { Tree } from '@fibrae/semi-ui-vue';

    const json = {
        Node1: {
            'Child Node1': '0-0-1',
            'Child Node2': '0-0-2',
        },
        Node2: '0-1',
    };

    const style = {
        width: '260px',
        height: '420px',
        border: '1px solid var(--semi-color-border)',
    };
</script>

<template>
    <Tree multiple :style="style" :treeDataSimpleJson="json" @change="(value) => console.log('当前所有选中项: ', value)" @select="(key) => console.log('当前选项: ', key)" />
</template>
