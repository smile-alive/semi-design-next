<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Cascader, type CascaderData } from '@fibrae/semi-ui-vue';

    const treeData = ref<CascaderData[]>([]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 3) + 1;
        treeData.value = Array.from({ length: itemLength }, (_, i) => {
            const length = Math.floor(Math.random() * 3);
            const children = Array.from({ length }, (_, ci) => ({
                key: `${i}-${ci}`,
                label: `Item-${i}-${ci}`,
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
    <Cascader placeholder="请选择" :style="{ width: '300px' }" :treeData="treeData" />
    <br />
    <br />
    <Button @click="add">动态改变数据</Button>
</template>
