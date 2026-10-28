import { Tag, Space } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    return (
        <Space>
            <Tag size="small" color="light-blue">
                small tag
            </Tag>
            <Tag size="large" color="cyan">
                large tag
            </Tag>
        </Space>
    );
}
