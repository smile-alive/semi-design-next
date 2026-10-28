<script setup lang="ts">
    import { shallowRef } from 'vue';
    import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const treeData = shallowRef<TreeNodeData[]>([
        {
            label: 'Expand to load',
            value: '0',
            key: '0',
        },
        {
            label: 'Expand to load',
            value: '1',
            key: '1',
        },
        {
            label: 'Leaf Node',
            value: '2',
            key: '2',
            isLeaf: true,
        },
    ]);

    function updateTreeData(list: TreeNodeData[], key: string | undefined, children: TreeNodeData[]): TreeNodeData[] {
        return list.map((node) => {
            if (node.key === key) {
                return { ...node, children };
            }
            if (node.children) {
                return { ...node, children: updateTreeData(node.children, key, children) };
            }
            return node;
        });
    }

    function loadData({ key, children }: TreeNodeData) {
        return new Promise<void>((resolve) => {
            if (children) {
                resolve();
                return;
            }
            setTimeout(() => {
                treeData.value = updateTreeData(treeData.value, key, [
                    {
                        label: 'Child Node',
                        key: `${key}-0`,
                    },
                    {
                        label: 'Child Node',
                        key: `${key}-1`,
                    },
                ]);
                resolve();
            }, 1000);
        });
    }
</script>

<template>
    <TreeSelect :loadData="loadData" placeholder="请选择" style="width: 300px" :treeData="treeData" />
</template>
