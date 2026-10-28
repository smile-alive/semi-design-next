import { Space, Tag } from '@fibrae/semi-ui-solid';

export default function TagDemo() {
    return (
        <Space>
            <Tag size="small" shape="circle" color="amber">
                small circle tag
            </Tag>
            <Tag size="large" shape="circle" color="violet">
                large circle tag
            </Tag>
        </Space>
    );
}
