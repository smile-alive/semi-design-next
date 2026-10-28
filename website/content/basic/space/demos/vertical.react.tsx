import { Space, Button } from '@fibrae/semi-ui-react';

export default function SpaceDemo() {
    return (
        <Space vertical>
            <Button theme="solid" type="primary">
                按钮
            </Button>
            <Button theme="solid" type="primary">
                按钮
            </Button>
            <Button theme="solid" type="primary">
                按钮
            </Button>
            <Button theme="solid" type="primary">
                按钮
            </Button>
        </Space>
    );
}
