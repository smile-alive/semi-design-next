import { createSignal } from 'solid-js';
import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-solid';

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

export default function TreeSelectDemo() {
    const [treeData, setTreeData] = createSignal<TreeNodeData[]>(initialData);

    const onLoadData = (treeNode?: TreeNodeData) => {
        return new Promise<void>((resolve) => {
            if (!treeNode || treeNode.children) {
                resolve();
                return;
            }
            const key = treeNode.key;
            setTimeout(() => {
                setTreeData((origin) =>
                    updateTreeData(origin, key, [
                        {
                            label: 'Child Node',
                            key: `${key}-0`,
                        },
                        {
                            label: 'Child Node',
                            key: `${key}-1`,
                        },
                    ])
                );
                resolve();
            }, 1000);
        });
    };

    return <TreeSelect loadData={onLoadData} treeData={treeData()} style={{ width: '300px' }} placeholder="请选择" />;
}
