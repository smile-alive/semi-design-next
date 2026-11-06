import { Space, Tag, type TagColor } from '@fibrae/semi-ui-react';

const colors: TagColor[] = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'light-blue', 'light-green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet', 'yellow', 'white'];

export default function TagDemo() {
    return (
        <Space wrap>
            {colors.map((color) => (
                <Tag color={color} key={color}>
                    {color}
                </Tag>
            ))}
        </Space>
    );
}
