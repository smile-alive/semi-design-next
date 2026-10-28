import { createSignal } from 'solid-js';
import { Tree, type TreeNodeData } from '@fibrae/semi-ui-solid';

const treeData: TreeNodeData[] = [
    {
        label: '亚洲',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: '中国',
                value: 'China',
                key: '0-0',
                children: [
                    {
                        label: '北京',
                        value: 'Beijing',
                        key: '0-0-0',
                    },
                    {
                        label: '上海',
                        value: 'Shanghai',
                        key: '0-0-1',
                    },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: '1',
    },
];

const style = {
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const [value, setValue] = createSignal('Shanghai');

    return (
        <Tree
            treeData={treeData}
            value={value()}
            onChange={(next) => {
                if (typeof next === 'string') {
                    setValue(next);
                }
            }}
            style={style}
        />
    );
}
