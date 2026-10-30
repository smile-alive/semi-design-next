<script lang="ts">
    import { Cascader, type CascaderData } from '@fibrae/semi-ui-svelte';

    let treeData = $state<CascaderData[]>([
        { label: 'Node1', value: '0-0' },
        { label: 'Node2', value: '0-1' },
        { label: 'Node3', value: '0-2', isLeaf: true },
    ]);

    const updateTreeData = (list: CascaderData[], value: CascaderData['value'], children: CascaderData[]): CascaderData[] =>
        list.map((node) => {
            if (node.value === value) {
                return { ...node, children };
            }
            if (node.children) {
                return { ...node, children: updateTreeData(node.children, value, children) };
            }
            return node;
        });

    const loadData = (selectedOpt: CascaderData[]) => {
        const targetOpt = selectedOpt[selectedOpt.length - 1];
        const { label, value } = targetOpt;
        return new Promise<void>((resolve) => {
            if (targetOpt.children) {
                resolve();
                return;
            }

            setTimeout(() => {
                treeData = updateTreeData(treeData, value, [
                    {
                        label: `${label} - 1`,
                        value: `${label}-1`,
                        isLeaf: selectedOpt.length > 1,
                    },
                    {
                        label: `${label} - 2`,
                        value: `${label}-2`,
                        isLeaf: selectedOpt.length > 1,
                    },
                ]);
                resolve();
            }, 1000);
        });
    };
</script>

<Cascader {loadData} placeholder="Please select" style="width: 300px" {treeData} />
