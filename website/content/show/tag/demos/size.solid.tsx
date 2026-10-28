import { Space, Tag } from '@fibrae/semi-ui-solid';

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
