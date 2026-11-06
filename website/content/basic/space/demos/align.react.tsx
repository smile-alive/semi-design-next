import { Space, Button, Tag } from '@fibrae/semi-ui-react';

const aligns = ['start', 'center', 'end', 'baseline'] as const;
const boxStyle = {
    width: 80,
    height: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--semi-color-border)',
    borderRadius: 3,
};

export default function SpaceDemo() {
    return (
        <Space vertical>
            {aligns.map((align) => (
                <Space key={align} align={align}>
                    <div style={boxStyle}>文本</div>
                    <Button theme="solid" type="primary">
                        按钮
                    </Button>
                    <Tag color="green" size="large">
                        标签
                    </Tag>
                </Space>
            ))}
        </Space>
    );
}
