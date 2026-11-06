import type { ReactNode } from 'react';
import { Tree, Typography } from '@fibrae/semi-ui-react';

const treeData = [
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
    width: 260,
    height: 420,
    border: '1px solid var(--semi-color-border)',
};

const renderLabel = (label?: ReactNode) => (
    <Typography.Text ellipsis={{ showTooltip: true }} style={{ width: '100%' }}>
        {label}
    </Typography.Text>
);

export default function TreeDemo() {
    return <Tree treeData={treeData} renderLabel={renderLabel} style={treeStyle} />;
}
