import { createSignal } from 'solid-js';
import { Button, Cascader, type CascaderData } from '@fibrae/semi-ui-solid';

export default function CascaderDemo() {
    const [treeData, setTreeData] = createSignal<CascaderData[]>([]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 3) + 1;
        const newTreeData = Array.from({ length: itemLength }, (_v, i) => {
            const length = Math.floor(Math.random() * 3);
            const children = Array.from({ length }, (_cv, ci) => ({
                key: `${i}-${ci}`,
                label: `Item-${i}-${ci}`,
                value: `${i}-${ci}`,
            }));
            return {
                key: `${i}`,
                label: `Item-${i}`,
                value: `${i}`,
                children,
            };
        });
        setTreeData(newTreeData);
    };

    return (
        <>
            <Cascader style={{ width: '300px' }} treeData={treeData()} placeholder="请选择" />
            <br />
            <br />
            <Button onClick={add}>动态改变数据</Button>
        </>
    );
}
