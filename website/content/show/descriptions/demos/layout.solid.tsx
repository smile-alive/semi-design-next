import { Descriptions, type DescriptionsData, Space, Tag } from '@fibrae/semi-ui-solid';

const data: DescriptionsData[] = [{ key: '抖音号', value: 'SemiDesign' }, { key: '主播类型', value: '自由主播' }, { key: '安全等级', value: '3级' }, { key: '垂类标签' }, { key: '作品数量', value: '88888888' }, { key: '认证状态', value: '这是一个很长很长很长很长很长很长很长很长很长的值', span: 3 }];

const renderValue = (item: DescriptionsData, index: number) =>
    index === 3 ? (
        <Space>
            <Tag size="small" shape="circle" color="amber">
                互联网资讯
            </Tag>
            <Tag size="small" shape="circle" color="violet">
                编程
            </Tag>
        </Space>
    ) : (
        item.value
    );

export default function DescriptionsDemo() {
    return <Descriptions layout="vertical" align="plain" data={data} column={4} renderValue={renderValue} />;
}
