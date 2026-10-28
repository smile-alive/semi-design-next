import { Space, Tag } from '@fibrae/semi-ui-solid';

export default function TagDemo() {
    return (
        <div>
            <Space>
                <Tag>default tag</Tag>
                <Tag closable>Closable Tag</Tag>
                <Tag closable onClose={(_, e) => e.preventDefault()}>
                    Closable Tag, Prevent Default
                </Tag>
            </Space>
        </div>
    );
}
