import { useState } from 'react';
import { Tree } from '@fibrae/semi-ui-react';

export default function TreeDemo() {
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const treeData = [
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
    return (
        <Tree
            style={{ width: 300 }}
            treeData={treeData}
            filterTreeNode
            expandedKeys={expandedKeys}
            onExpand={(expandedKeys) => {
                setExpandedKeys(expandedKeys);
            }}
            onSearch={(_inputValue, filteredExpandedKeys) => {
                setExpandedKeys([...filteredExpandedKeys]);
            }}
        />
    );
}
