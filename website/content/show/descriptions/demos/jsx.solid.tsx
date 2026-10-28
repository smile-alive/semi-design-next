import { Descriptions } from '@fibrae/semi-ui-solid';

export default function DescriptionsDemo() {
    return (
        <Descriptions>
            <Descriptions.Item itemKey="实际用户数量">1,480,000</Descriptions.Item>
            <Descriptions.Item itemKey="7天留存">98%</Descriptions.Item>
            <Descriptions.Item itemKey="安全等级">3级</Descriptions.Item>
            <Descriptions.Item itemKey="垂类标签">电商</Descriptions.Item>
            <Descriptions.Item itemKey="认证状态">未认证</Descriptions.Item>
        </Descriptions>
    );
}
