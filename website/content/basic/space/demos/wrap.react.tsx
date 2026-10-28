import { Space, Button } from '@fibrae/semi-ui-react';

export default function SpaceDemo() {
    return (
        <Space wrap>
            {Array.from({ length: 10 }, (_item, idex) => (
                <Button theme="solid" type="secondary" key={idex}>
                    按钮
                </Button>
            ))}
        </Space>
    );
}
