<script setup lang="ts">
    import { ref, shallowRef } from 'vue';
    import Tree, { type TreeNodeData } from '../..';
    import Button from '../../../button';

    const data = shallowRef<TreeNodeData[]>([{ key: '0', label: 'item-0', value: '0' }]);
    const inputValue = ref('');
    const expandedKeys = ref<string[]>([]);
    const autoExpandParent = ref(false);

    const update = (nextData: TreeNodeData[], nextInputValue: string) => {
        const keys: string[] = [];
        const collect = (nodes: TreeNodeData[]) => {
            for (const node of nodes) {
                if (String(node.label).includes(nextInputValue)) {
                    keys.push(node.key as string);
                }
                if (node.children) {
                    collect(node.children);
                }
            }
        };
        collect(nextData);
        data.value = nextData;
        inputValue.value = nextInputValue;
        expandedKeys.value = keys;
        autoExpandParent.value = true;
    };
    const changeData = () =>
        update(
            [0, 1].map((i) => ({
                key: `${i}`,
                label: `Item-${i}`,
                value: `${i}`,
                children: [0, 1].map((ci) => ({ key: `${i}-${ci}`, label: `Leaf-${i}-${ci}`, value: `${i}-${ci}` })),
            })),
            inputValue.value
        );
    const handleExpand = (keys: string[]) => {
        expandedKeys.value = keys;
        autoExpandParent.value = false;
    };
</script>

<template>
    <div>
        <Tree :autoExpandParent="autoExpandParent" :expandedKeys="expandedKeys" filterTreeNode :treeData="data" @expand="handleExpand" @search="update(data, $event)" />
        <Button @click="changeData">动态改变数据</Button>
    </div>
</template>
