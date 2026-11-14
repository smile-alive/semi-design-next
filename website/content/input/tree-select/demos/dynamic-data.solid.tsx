import { createSignal } from 'solid-js';
import { Button, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-solid';

export default function TreeSelectDemo() {
    const [treeData, setTreeData] = createSignal<TreeNodeData[]>([]);

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
            <TreeSelect style={{ width: '300px' }} styles={{ dropdown: { 'max-height': '400px', overflow: 'auto' } }} treeData={treeData()} placeholder="请选择" />
            <br />
            <br />
            <Button onClick={add}>动态改变数据</Button>
        </>
    );
}
