import { For } from 'solid-js';
import { Button, Space, Tag } from '@fibrae/semi-ui-solid';

const aligns = ['start', 'center', 'end', 'baseline'] as const;
const boxStyle = {
    width: '80px',
    height: '100px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    border: '1px solid var(--semi-color-border)',
    'border-radius': '3px',
};

export default function SpaceDemo() {
    return (
        <Space vertical>
            <For each={aligns}>
                {(align) => (
                    <Space align={align}>
                        <div style={boxStyle}>文本</div>
                        <Button theme="solid" type="primary">
                            按钮
                        </Button>
                        <Tag color="green" size="large">
                            标签
                        </Tag>
                    </Space>
                )}
            </For>
        </Space>
    );
}
