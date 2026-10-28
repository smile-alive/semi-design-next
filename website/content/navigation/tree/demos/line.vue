<script setup lang="ts">
    import { ref } from 'vue';
    import { Switch, Tree } from '@fibrae/semi-ui-vue';

    const show = ref(true);

    const treeData = [
        {
            label: 'parent-0',
            key: 'parent-0',
            children: [
                {
                    label: 'leaf-0-0',
                    key: 'leaf-0-0',
                    children: [
                        { label: 'leaf-0-0-0', key: 'leaf-0-0-0' },
                        { label: 'leaf-0-0-1', key: 'leaf-0-0-1' },
                        { label: 'leaf-0-0-2', key: 'leaf-0-0-2' },
                    ],
                },
                { label: 'leaf-0-1', key: 'leaf-0-1' },
            ],
        },
        { label: 'parent-1', key: 'parent-1' },
    ];

    const style = {
        width: '260px',
        height: '420px',
        border: '1px solid var(--semi-color-border)',
    };
</script>

<template>
    <div :style="{ display: 'flex', alignItems: 'center', columnGap: '5px', marginBottom: '5px' }">
        <strong id="tree-line-show-line">showLine </strong>
        <Switch v-model="show" aria-labelledby="tree-line-show-line" />
    </div>
    <Tree defaultExpandAll :showLine="show" :style="style" :treeData="treeData" />
</template>
