import { Descriptions } from '@fibrae/semi-ui-react';

export default function DescriptionsDemo() {
    return (
        <Descriptions align="center">
            <Descriptions.Item itemKey="姓名" styles={{ key: { width: 120, color: 'var(--semi-color-primary)' } }}>
                李四
            </Descriptions.Item>
            <Descriptions.Item itemKey="年龄" styles={{ key: { width: 120, color: 'var(--semi-color-primary)' } }}>
                28
            </Descriptions.Item>
            <Descriptions.Item itemKey="职业" styles={{ key: { width: 120, color: 'var(--semi-color-primary)' } }}>
                前端工程师
            </Descriptions.Item>
        </Descriptions>
    );
}
