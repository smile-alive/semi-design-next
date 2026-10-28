import { Descriptions, type DescriptionsData, Tag } from '@fibrae/semi-ui-solid';

const data: DescriptionsData[] = [
    { key: '抖音号', value: 'SemiDesign' },
    { key: '主播类型', value: '自由主播' },
    { key: '安全等级', value: '3级' },
    { key: '垂类标签', value: '编程' },
    { key: '作品数量', value: '88888888' },
    { key: '认证状态', value: '这是一个很长很长很长很长很长很长很长很长很长的值', span: 3 },
    { key: '上次直播时间', value: '2024-05-01 12:00:00', span: 3 },
];

const renderValue = (item: DescriptionsData, index: number) =>
    index === 3 ? (
        <Tag size="small" shape="circle" color="violet">
            {item.value}
        </Tag>
    ) : (
        item.value
    );

export default function DescriptionsDemo() {
    return <Descriptions layout="horizontal" align="plain" data={data} column={5} renderValue={renderValue} />;
}
