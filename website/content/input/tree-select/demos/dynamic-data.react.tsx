import { useState } from 'react';
import { TreeSelect, Button, type TreeNodeData } from '@fibrae/semi-ui-react';
export default function TreeSelectDemo() {
    const [treeData, setTreeData] = useState<TreeNodeData[]>([]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 5) + 1;
        setTreeData(
            Array.from({ length: itemLength }, (_, i) => {
                const length = Math.floor(Math.random() * 3);
                const children = Array.from({ length }, (_, ci) => ({
                    key: `${i}-${ci}`,
                    label: `Leaf-${i}-${ci}`,
                    value: `${i}-${ci}`,
                }));
                return {
                    key: `${i}`,
                    label: `Item-${i}`,
                    value: `${i}`,
                    children,
                };
            })
        );
    };

    return (
        <>
            <TreeSelect style={{ width: 300 }} styles={{ dropdown: { maxHeight: 400, overflow: 'auto' } }} treeData={treeData} placeholder="请选择" />
            <br />
            <br />
            <Button onClick={add}>动态改变数据</Button>
        </>
    );
}
