import { Tree, Typography, type TreeNodeData } from '@fibrae/semi-ui-solid';

const treeDataWithNode: TreeNodeData[] = [
    {
        label: '亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲亚洲',
        value: 'yazhou',
        key: 'yazhou',
        children: [
            {
                label: '中国中国中国中国中国中国中国中国中国中国中国中国',
                value: 'zhongguo',
                key: 'zhongguo',
            },
            {
                label: '日本日本日本日本日本日本日本日本日本日本日本日本',
                value: 'riben',
                key: 'riben',
            },
        ],
    },
];

const treeStyle = {
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

const renderLabel = (label?: string | number) => (
    <Typography.Text ellipsis={{ showTooltip: true }} style={{ width: '100%' }}>
        {label}
    </Typography.Text>
);

export default function TreeDemo() {
    return <Tree treeData={treeDataWithNode} renderLabel={renderLabel} style={treeStyle} />;
}
