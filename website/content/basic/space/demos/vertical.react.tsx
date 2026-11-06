import { Space, Button } from '@fibrae/semi-ui-react';

const fourButtons = [1, 2, 3, 4];

export default function SpaceDemo() {
    return (
        <Space vertical>
            {fourButtons.map((item) => (
                <Button key={item} theme="solid" type="primary">
                    按钮
                </Button>
            ))}
        </Space>
    );
}
