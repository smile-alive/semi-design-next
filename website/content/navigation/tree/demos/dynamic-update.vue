<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { Button, Tree, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const style = {
        width: '260px',
        height: '420px',
        border: '1px solid var(--semi-color-border)',
    };

    const treeData = shallowRef<TreeNodeData[]>([
        {
            key: '0',
            label: 'item-0',
            value: '0',
        },
    ]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 5) + 1;
        treeData.value = Array.from({ length: itemLength }).map((_, i) => {
            const length = Math.floor(Math.random() * 3);
            const children = Array.from({ length }).map((_, ci) => ({
                key: `${i}-${ci}`,
                label: `Leaf-${i}-${ci}`,
                value: `${i}-${ci}`,
            }));
            return {
                key: `${i}`,
                label: `Item-${i}`,
                value: `${i}`,
                children,
            };
        });
    };
</script>

<template>
    <div :style="style">
        <Tree :treeData="treeData" />
        <br />
        <Button :style="{ margin: '20px' }" @click="add">动态改变数据</Button>
    </div>
</template>
