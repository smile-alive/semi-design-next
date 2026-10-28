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
            {
                label: '日本',
                value: 'Japan',
                key: '0-1',
            },
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: '1',
    },
];

export default function TreeDemo() {
    const [expandedKeys, setExpandedKeys] = createSignal<string[]>([]);

    return (
        <Tree
            style={{ width: '300px' }}
            treeData={treeData}
            filterTreeNode
            expandedKeys={expandedKeys()}
            onExpand={(keys) => {
                setExpandedKeys(keys);
            }}
            onSearch={(_inputValue, filteredExpandedKeys) => {
                setExpandedKeys([...filteredExpandedKeys]);
            }}
        />
    );
}
