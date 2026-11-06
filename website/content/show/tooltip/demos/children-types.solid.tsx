import { Space, Tag, Tooltip } from '@fibrae/semi-ui-solid';

const style = { border: '2px solid var(--semi-color-border)', 'padding-inline-start': '4px', 'padding-inline-end': '4px', 'border-radius': '4px' };

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
