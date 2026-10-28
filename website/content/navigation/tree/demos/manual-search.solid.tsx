import { Input, Tree, type TreeElement, type TreeNodeData } from '@fibrae/semi-ui-solid';

const treeData: TreeNodeData[] = [
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

export default function TreeDemo() {
    let tree: TreeElement | undefined;
    return (
        <div>
            <Input aria-label="filter tree" prefix="Search" showClear onChange={(v) => tree?.search(v)} />
            <div style={{ 'margin-top': '20px' }}>搜索结果如下：</div>
            <Tree ref={(element) => (tree = element)} filterTreeNode searchRender={false} treeData={treeData} blockNode={false} />
        </div>
    );
}
