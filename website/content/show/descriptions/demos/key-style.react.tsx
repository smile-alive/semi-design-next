import { Descriptions, type DescriptionsData } from '@fibrae/semi-ui-react';

export default function DescriptionsDemo() {
    const data: DescriptionsData[] = [
        { key: '用户名', value: '张三', keyStyle: { width: 100, textAlign: 'right' } },
        { key: '电子邮箱', value: 'zhangsan@example.com', keyStyle: { width: 100, textAlign: 'right' } },
        { key: '联系电话', value: '138-0000-0000', keyStyle: { width: 100, textAlign: 'right' } },
        { key: '地址', value: '北京市朝阳区', keyStyle: { width: 100, textAlign: 'right' } },
    ];
    return <Descriptions data={data} align="center" />;
}
