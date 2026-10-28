import { For } from 'solid-js';
import { Card, Descriptions, type DescriptionsAlign, type DescriptionsData, Tag } from '@fibrae/semi-ui-solid';

const data: DescriptionsData[] = [
    { key: '实际用户数量', value: '1,480,000' },
    { key: '7天留存', value: '98%' },
    { key: '安全等级', value: '3级' },
    { key: '垂类标签', value: '电商' },
    { key: '认证状态', value: '未认证' },
];

const renderValue = (item: DescriptionsData, index: number) => (index === 3 ? <Tag style={{ margin: '0' }}>{item.value}</Tag> : item.value);

const aligns: DescriptionsAlign[] = ['center', 'justify', 'left', 'plain'];

const cardStyle = { margin: '10px' };

export default function DescriptionsDemo() {
    return (
        <div style={{ display: 'flex', 'flex-wrap': 'wrap' }}>
            <For each={aligns}>
                {(align) => (
                    <Card shadows="always" style={cardStyle}>
                        <Descriptions align={align} data={data} renderValue={renderValue} />
                    </Card>
                )}
            </For>
        </div>
    );
}
