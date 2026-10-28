import { useState } from 'react';
import { Cascader, Button, type CascaderData } from '@fibrae/semi-ui-react';

export default function CascaderDemo() {
    const [treeData, setTreeData] = useState<CascaderData[]>([]);

    const add = () => {
        let itemLength = Math.floor(Math.random() * 3) + 1;
        let newTreeData = Array.from({ length: itemLength }, (_v, i) => {
            let length = Math.floor(Math.random() * 3);
            let children = Array.from({ length }, (_cv, ci) => {
                let child = {
                    key: `${i}-${ci}`,
                    label: `Item-${i}-${ci}`,
                    value: `${i}-${ci}`,
                };
                return child;
            });
            let item = {
                key: `${i}`,
                label: `Item-${i}`,
                value: `${i}`,
                children,
            };
            return item;
        });
        setTreeData(newTreeData);
    };

    return (
        <>
            <Cascader style={{ width: 300 }} treeData={treeData} placeholder="请选择" />
            <br />
            <br />
            <Button onClick={add}>动态改变数据</Button>
        </>
    );
}
