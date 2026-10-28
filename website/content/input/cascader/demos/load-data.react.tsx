import { useState } from 'react';
import { Cascader, type CascaderData } from '@fibrae/semi-ui-react';

export default function CascaderDemo() {
    const initialData: CascaderData[] = [
        {
            label: 'Node1',
            value: '0-0',
        },
        {
            label: 'Node2',
            value: '0-1',
        },
        {
            label: 'Node3',
            value: '0-2',
            isLeaf: true,
        },
    ];
    const [data, setData] = useState(initialData);

    const updateTreeData = (list: CascaderData[], value: CascaderData['value'], children: CascaderData[]): CascaderData[] => {
        return list.map((node) => {
            if (node.value === value) {
                return { ...node, children };
            }
            if (node.children) {
                return { ...node, children: updateTreeData(node.children, value, children) };
            }
            return node;
        });
    };

    const onLoadData = (selectedOpt: CascaderData[]) => {
        const targetOpt = selectedOpt[selectedOpt.length - 1];
        const { label, value } = targetOpt;
        return new Promise<void>((resolve) => {
            if (targetOpt.children) {
                resolve();
                return;
            }

            setTimeout(() => {
                setData((origin) =>
                    updateTreeData(origin, value, [
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
                    ])
                );
                resolve();
            }, 1000);
        });
    };

    return <Cascader style={{ width: 300 }} treeData={data} loadData={onLoadData} placeholder="Please select" />;
}
