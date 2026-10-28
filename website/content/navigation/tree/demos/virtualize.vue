<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Tree, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const style = {
        width: '260px',
        border: '1px solid var(--semi-color-border)',
    };

    const virtualize = {
        // A set Tree height fills the remaining space
        height: 300,
        itemSize: 28,
    };

    function generateData(x = 5, y = 4, z = 3, data: TreeNodeData[] = []) {
        // x: nodes per level. y: nodes with children per level. z: depth (0 is one level)
        function fill(level: number, preKey: string, nodes: TreeNodeData[]) {
            const parents: string[] = [];
            for (let i = 0; i < x; i++) {
                const key = `${preKey}-${i}`;
                nodes.push({ label: `${key}-标签`, key: `${key}-key`, value: `${key}-value` });
                if (i < y) {
                    parents.push(key);
                }
            }
            if (level < 0) {
                return;
            }
            parents.forEach((key, index) => {
                const children: TreeNodeData[] = [];
                nodes[index].children = children;
                fill(level - 1, key, children);
            });
        }
        fill(z, '0', data);

        let total = 0;
        for (let n = z + 1; n >= 0; n--) {
            total += x * y ** n;
        }
        return { gData: data, total };
    }

    const gData = ref<TreeNodeData[]>([]);
    const total = ref(0);

    const onGen = () => {
        const data = generateData();
        gData.value = data.gData;
        total.value = data.total;
    };
</script>

<template>
    <div :style="{ padding: '0 20px' }">
        <Button @click="onGen">生成数据: </Button>
        <span>共 {{ total }} 个节点</span>
        <br />
        <br />
        <Tree v-if="gData.length" filterTreeNode showFilteredOnly :style="style" :treeData="gData" :virtualize="virtualize" />
    </div>
</template>
