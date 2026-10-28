import { useState } from 'react';
import { Tree } from '@fibrae/semi-ui-react';

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
        ],
    },
    {
        label: '北美洲',
        value: 'North America',
        key: '1',
    },
];

const style = {
    width: 260,
    height: 420,
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const [expandedKeys, setExpandedKeys] = useState(['0', '0-0']);

    return (
        <>
            <div>需要先将“中国”节点收起后，才能够收起“亚洲”节点</div>
            <br />
            <Tree autoExpandParent treeData={treeData} onExpand={setExpandedKeys} expandedKeys={expandedKeys} style={style} />
        </>
    );
}
