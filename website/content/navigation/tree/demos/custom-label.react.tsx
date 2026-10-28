import { Tree, Tag } from '@fibrae/semi-ui-react';

export default function TreeDemo() {
    // Node content is display-only: focus stays on the tree, so buttons and links inside are keyboard-unreachable
    const tag = (text: string) => <Tag size="small">{text}</Tag>;

    const style = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    const treeDataWithNode = [
        {
            label: (
                <div style={style}>
                    <span>亚洲</span>
                    {tag('大洲')}
                </div>
            ),
            value: 'yazhou',
            key: 'yazhou',
            children: [
                {
                    label: (
                        <div style={style}>
                            <span>中国</span>
                            {tag('国家')}
                        </div>
                    ),
                    value: 'zhongguo',
                    key: 'zhongguo',
                },
                {
                    label: (
                        <div style={style}>
                            <span>日本</span>
                            {tag('国家')}
                        </div>
                    ),
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
    return <Tree treeData={treeDataWithNode} style={treeStyle} />;
}
