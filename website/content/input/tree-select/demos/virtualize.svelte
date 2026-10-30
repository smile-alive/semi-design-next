<script lang="ts">
    import { Button, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-svelte';

    let treeData = $state.raw<TreeNodeData[]>([]);
    let total = $state(0);

    // x: nodes per level. y: nodes with children per level. z: depth (0 is one level).
    const generateData = (x = 5, y = 4, z = 3) => {
        const data: TreeNodeData[] = [];

        const fill = (level: number, preKey: string, nodes: TreeNodeData[]) => {
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
        };
        fill(z, '0', data);

        let count = 0;
        for (let n = z + 1; n >= 0; n--) {
            count += x * y ** n;
        }
        return { data, count };
    };

    const onGen = () => {
        const generated = generateData();
        treeData = generated.data;
        total = generated.count;
    };

    const dropdownStyle = 'overflow: hidden';
    // Dropdown height 300 minus the search box, minus the 8 * 2 padding; a set dropdown height fills the remaining space.
    const virtualize = { itemSize: 28, height: 236 };
</script>

<div style="padding: 0 20px">
    <Button onclick={onGen}>生成数据:</Button>
    <span>共 {total} 个节点</span>
    <br />
    <br />
    {#if treeData.length}
        <TreeSelect {dropdownStyle} filterTreeNode placeholder="Please select" showFilteredOnly style="width: 300px" {treeData} {virtualize} />
    {/if}
</div>
