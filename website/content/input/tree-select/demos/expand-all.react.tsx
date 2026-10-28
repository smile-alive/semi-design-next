import { useEffect, useState } from 'react';
import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-react';

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

export default function TreeSelectDemo() {
    const [data, setData] = useState<TreeNodeData[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => setData(treeData), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <TreeSelect style={{ width: 300, marginBottom: 20 }} expandAll treeData={data} placeholder="expandAll" />
            <TreeSelect style={{ width: 300 }} defaultExpandAll treeData={data} placeholder="defaultExpandAll" />
        </>
    );
}
