<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { Button, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const style = { width: '300px' };
    const dropdownStyle = { maxHeight: '400px', overflow: 'auto' };
    const treeData = shallowRef<TreeNodeData[]>([]);

    function add() {
        const itemLength = Math.floor(Math.random() * 5) + 1;
        treeData.value = Array.from({ length: itemLength }, (_, i) => {
            const length = Math.floor(Math.random() * 3);
            const children = Array.from({ length }, (_, ci) => ({
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
    }
</script>

<template>
    <TreeSelect :dropdownStyle="dropdownStyle" placeholder="请选择" :style="style" :treeData="treeData" />
    <br />
    <br />
    <Button @click="add">动态改变数据</Button>
</template>
