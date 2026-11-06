import { Tooltip, Space, Tag } from '@fibrae/semi-ui-react';

const style = { border: '2px solid var(--semi-color-border)', paddingInlineStart: 4, paddingInlineEnd: 4, borderRadius: 4 };

export default function TooltipDemo() {
    return (
        <Space>
            <Tooltip content="semi design">
                <Tag style={style}>Component</Tag>
            </Tooltip>
            <Tooltip content="semi design">Text</Tooltip>
            <Tooltip content="semi design">
                <span style={style}>DOM</span>
            </Tooltip>
        </Space>
    );
}
