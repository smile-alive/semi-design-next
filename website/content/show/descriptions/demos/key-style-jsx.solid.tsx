import { Descriptions } from '@fibrae/semi-ui-solid';

const keyStyle = { width: '120px', color: 'var(--semi-color-primary)' };

export default function DescriptionsDemo() {
    return (
        <Descriptions align="center">
            <Descriptions.Item itemKey="姓名" keyStyle={keyStyle}>
                李四
            </Descriptions.Item>
            <Descriptions.Item itemKey="年龄" keyStyle={keyStyle}>
                28
            </Descriptions.Item>
            <Descriptions.Item itemKey="职业" keyStyle={keyStyle}>
                前端工程师
            </Descriptions.Item>
        </Descriptions>
    );
}
