import { Tag, Space } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    return (
        <div>
            <Space>
                <Tag>default tag</Tag>
                <Tag closable>Closable Tag</Tag>
                <Tag closable onClose={(_value, e) => e.preventDefault()}>
                    Closable Tag, Prevent Default
                </Tag>
            </Space>
        </div>
    );
}
