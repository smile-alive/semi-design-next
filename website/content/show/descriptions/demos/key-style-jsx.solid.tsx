import { Descriptions } from '@fibrae/semi-ui-solid';

const styles = { key: { width: '120px', color: 'var(--semi-color-primary)' } };

export default function DescriptionsDemo() {
    return (
        <Descriptions align="center">
            <Descriptions.Item itemKey="姓名" styles={styles}>
                李四
            </Descriptions.Item>
            <Descriptions.Item itemKey="年龄" styles={styles}>
                28
            </Descriptions.Item>
            <Descriptions.Item itemKey="职业" styles={styles}>
                前端工程师
            </Descriptions.Item>
        </Descriptions>
    );
}
