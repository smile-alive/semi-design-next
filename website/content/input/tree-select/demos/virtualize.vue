<script setup lang="ts">
    import { ref, shallowRef } from 'vue';
    import { Button, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-vue';

    const treeData = shallowRef<TreeNodeData[]>([]);
    const total = ref(0);

    // x: nodes per level. y: nodes with children per level. z: depth (0 is one level).
    function generateData(x = 5, y = 4, z = 3) {
        const data: TreeNodeData[] = [];

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

        let count = 0;
        for (let n = z + 1; n >= 0; n--) {
            count += x * y ** n;
        }
        return { data, count };
    }

    function onGen() {
        const { data, count } = generateData();
        treeData.value = data;
        total.value = count;
    }

    const dropdownStyle = { overflow: 'hidden' };
    // Dropdown height 300 minus the search box, minus the 8 * 2 padding; a set dropdown height fills the remaining space.
    const virtualize = { itemSize: 28, height: 236 };
</script>

<template>
    <div style="padding: 0 20px">
        <Button @click="onGen">生成数据: </Button>
        <span>共 {{ total }} 个节点</span>
        <br />
        <br />
        <TreeSelect v-if="treeData.length" :dropdownStyle="dropdownStyle" filterTreeNode placeholder="Please select" showFilteredOnly style="width: 300px" :treeData="treeData" :virtualize="virtualize" />
    </div>
</template>
