<script lang="ts">
    import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-svelte';

    const initialData: TreeNodeData[] = [
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
    ];

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

    let treeData = $state.raw(initialData);

    const onLoadData = ({ key, children }: TreeNodeData) => {
        return new Promise<void>((resolve) => {
            if (children) {
                resolve();
                return;
            }
            setTimeout(() => {
                treeData = updateTreeData(treeData, key, [
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
    };
</script>

<TreeSelect loadData={onLoadData} placeholder="请选择" style="width: 300px" {treeData} />
