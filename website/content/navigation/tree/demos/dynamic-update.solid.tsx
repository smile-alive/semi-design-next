import { createSignal } from 'solid-js';
import { Button, Tree, type TreeNodeData } from '@fibrae/semi-ui-solid';

const style = {
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const [treeData, setTreeData] = createSignal<TreeNodeData[]>([
        {
            key: '0',
            label: 'item-0',
            value: '0',
        },
    ]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 5) + 1;
        const nextTreeData = Array.from({ length: itemLength }).map((_, i) => {
            const length = Math.floor(Math.random() * 3);
            const children = Array.from({ length }).map((_child, ci) => {
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
        <div style={style}>
            <Tree treeData={treeData()} />
            <br />
            <Button onClick={add} style={{ margin: '20px' }}>
                动态改变数据
            </Button>
        </div>
    );
}
