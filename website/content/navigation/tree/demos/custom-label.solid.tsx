import { Tag, Tree, type TreeNodeData } from '@fibrae/semi-ui-solid';

const rowStyle = {
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
};

const treeStyle = {
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const treeData: TreeNodeData[] = [
        {
            label: '亚洲',
            value: 'yazhou',
            key: 'yazhou',
            children: [
                {
                    label: '中国',
                    value: 'zhongguo',
                    key: 'zhongguo',
                },
                {
                    label: '日本',
                    value: 'riben',
                    key: 'riben',
                },
            ],
        },
    ];

    // Node content is display-only: focus stays on the tree, so buttons and links inside are keyboard-unreachable
    return (
        <Tree
            treeData={treeData}
            style={treeStyle}
            renderLabel={(label, node) => (
                <div style={rowStyle}>
                    <span>{label}</span>
                    <Tag size="small">{node?.children ? '大洲' : '国家'}</Tag>
                </div>
            )}
        />
    );
}
