import { useState } from 'react';
import { TreeSelect, Button, type TreeNodeData } from '@fibrae/semi-ui-react';
export default function TreeSelectDemo() {
    const [treeData, setTreeData] = useState<TreeNodeData[]>([]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 5) + 1;
        const nextTreeData = Array.from({ length: itemLength }, (_v, i) => {
            const length = Math.floor(Math.random() * 3);
            const children = Array.from({ length }, (_cv, ci) => {
                const child = {
                    key: `${i}-${ci}`,
                    label: `Leaf-${i}-${ci}`,
                    value: `${i}-${ci}`,
                };
                return child;
            });
            const item = {
                key: `${i}`,
                label: `Item-${i}`,
                value: `${i}`,
                children,
            };
            return item;
        });
        setTreeData(nextTreeData);
    };

    return (
        <>
            <TreeSelect style={{ width: 300 }} dropdownStyle={{ maxHeight: 400, overflow: 'auto' }} treeData={treeData} placeholder="请选择" />
            <br />
            <br />
            <Button onClick={add}>动态改变数据</Button>
        </>
    );
}
