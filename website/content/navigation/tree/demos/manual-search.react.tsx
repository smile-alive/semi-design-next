import { useRef } from 'react';
import { Tree, Input, type TreeHandle } from '@fibrae/semi-ui-react';

export default function TreeDemo() {
    const ref = useRef<TreeHandle>(null);
    const treeData = [
        {
            label: 'Asia',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: 'China',
                    value: 'China',
                    key: '0-0',
                    children: [
                        {
                            label: 'Beijing',
                            value: 'Beijing',
                            key: '0-0-0',
                        },
                        {
                            label: 'Shanghai',
                            value: 'Shanghai',
                            key: '0-0-1',
                        },
                    ],
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                    children: [
                        {
                            label: 'Osaka',
                            value: 'Osaka',
                            key: '0-1-0',
                        },
                    ],
                },
            ],
        },
        {
            label: 'North America',
            value: 'North America',
            key: '1',
            children: [
                {
                    label: 'United States',
                    value: 'United States',
                    key: '1-0',
                },
                {
                    label: 'Canada',
                    value: 'Canada',
                    key: '1-1',
                },
            ],
        },
    ];
    return (
        <div>
            <Input aria-label="filter tree" prefix="Search" showClear onChange={(v) => ref.current?.search(v)} />
            <div style={{ marginTop: 20 }}>搜索结果如下：</div>
            <Tree ref={ref} filterTreeNode searchRender={false} treeData={treeData} blockNode={false} />
        </div>
    );
}
