import { IconArrowUp } from '@fibrae/semi-icons-solid';
import { Descriptions, type DescriptionsData, Tag } from '@fibrae/semi-ui-solid';

const data: DescriptionsData[] = [
    { key: '实际用户数量', value: '1,480,000' },
    { key: '7天留存', value: '98%' },
    { key: '安全等级', value: '3级' },
    { key: '垂类标签', value: '电商' },
    { key: '认证状态', value: '未认证' },
];

const renderValue = (item: DescriptionsData, index: number) => {
    if (index === 1) {
        return (
            <div>
                {item.value}
                <IconArrowUp size="small" style={{ color: 'var(--semi-color-success)', 'margin-left': '2px' }} />
            </div>
        );
    }
    return index === 3 ? <Tag style={{ margin: '0' }}>{item.value}</Tag> : item.value;
};

export default function DescriptionsDemo() {
    return <Descriptions data={data} renderValue={renderValue} />;
}
