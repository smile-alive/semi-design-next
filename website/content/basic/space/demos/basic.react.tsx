import { Space, Button, Switch } from '@fibrae/semi-ui-react';

export default function SpaceDemo() {
    return (
        <Space>
            <Switch aria-label="示例开关" defaultChecked />
            <Button type="secondary">次要</Button>
            <Button type="tertiary">第三</Button>
            <Button type="warning">警告</Button>
        </Space>
    );
}
