import { useState } from 'react';
import { Tree, Button } from '@fibrae/semi-ui-react';

const style = {
    width: 260,
    height: 420,
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const [treeData, setTreeData] = useState([
        {
            key: '0',
            label: 'item-0',
            value: '0',
        },
    ]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 5) + 1;
        setTreeData(
            Array.from({ length: itemLength }).map((_, i) => {
                const length = Math.floor(Math.random() * 3);
                const children = Array.from({ length }).map((_, ci) => ({
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
        <div style={style}>
            <Tree treeData={treeData} />
            <br />
            <Button onClick={add} style={{ margin: 20 }}>
                动态改变数据
            </Button>
        </div>
    );
}
