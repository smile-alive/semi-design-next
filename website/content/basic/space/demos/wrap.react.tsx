import { Space, Button } from '@fibrae/semi-ui-react';

const tenButtons = Array.from({ length: 10 }, (_, index) => index);

export default function SpaceDemo() {
    return (
        <Space wrap>
            {tenButtons.map((item) => (
                <Button key={item} theme="solid" type="secondary">
                    按钮
                </Button>
            ))}
        </Space>
    );
}
