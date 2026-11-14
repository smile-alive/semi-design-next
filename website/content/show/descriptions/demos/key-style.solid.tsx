import { Descriptions, type DescriptionsData } from '@fibrae/semi-ui-solid';

const styles = { key: { width: '100px', 'text-align': 'right' } } as const;

const data: DescriptionsData[] = [
    { key: '用户名', value: '张三', styles },
    { key: '电子邮箱', value: 'zhangsan@example.com', styles },
    { key: '联系电话', value: '138-0000-0000', styles },
    { key: '地址', value: '北京市朝阳区', styles },
];

export default function DescriptionsDemo() {
    return <Descriptions data={data} align="center" />;
}
