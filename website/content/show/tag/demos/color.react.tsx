import { Tag, Space } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    return (
        <Space wrap>
            {(['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'light-blue', 'light-green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet', 'yellow', 'white'] as const).map((item) => (
                <Tag color={item} key={item}>
                    {item}
                </Tag>
            ))}
        </Space>
    );
}
