<script setup lang="ts">
    import { ref } from 'vue';
    import { Tree, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const treeData = ref<TreeNodeData[]>([
        { label: 'Expand to load', value: '0', key: '0' },
        { label: 'Expand to load', value: '1', key: '1' },
        { label: 'Leaf Node', value: '2', key: '2', isLeaf: true },
    ]);

    const updateTreeData = (list: TreeNodeData[], key: string | undefined, children: TreeNodeData[]): TreeNodeData[] => {
        return list.map((node) => {
            if (node.key === key) {
                return { ...node, children };
            }
            if (node.children) {
                return { ...node, children: updateTreeData(node.children, key, children) };
            }
            return node;
        });
    };

    const onLoadData = (treeNode?: TreeNodeData) => {
        const key = treeNode?.key;
        return new Promise<void>((resolve) => {
            if (treeNode?.children) {
                resolve();
                return;
            }
            setTimeout(() => {
                treeData.value = updateTreeData(treeData.value, key, [
                    { label: 'Child Node', key: `${key}-0` },
                    { label: 'Child Node', key: `${key}-1` },
                ]);
                resolve();
            }, 1000);
        });
    };
</script>

<template>
    <Tree :loadData="onLoadData" :treeData="treeData" />
</template>
