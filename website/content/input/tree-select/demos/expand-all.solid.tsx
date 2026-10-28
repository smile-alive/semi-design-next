import { createSignal, onCleanup, onMount } from 'solid-js';
import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-solid';

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
    const [data, setData] = createSignal<TreeNodeData[]>([]);

    onMount(() => {
        const timer = setTimeout(() => setData(treeData), 500);
        onCleanup(() => clearTimeout(timer));
    });

    return (
        <>
            <TreeSelect style={{ width: '300px', 'margin-bottom': '20px' }} expandAll treeData={data()} placeholder="expandAll" />
            <TreeSelect style={{ width: '300px' }} defaultExpandAll treeData={data()} placeholder="defaultExpandAll" />
        </>
    );
}
