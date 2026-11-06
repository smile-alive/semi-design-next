import { IconArrowUp } from '@fibrae/semi-icons-react';
import { Descriptions, Tag } from '@fibrae/semi-ui-react';

const data = [
    { key: '实际用户数量', value: '1,480,000' },
    {
        key: '7天留存',
        value: (
            <div>
                98%
                <IconArrowUp size="small" style={{ color: 'var(--semi-color-success)', marginInlineStart: '2px' }} />
            </div>
        ),
    },
    { key: '安全等级', value: '3级' },
    { key: '垂类标签', value: <Tag style={{ margin: 0 }}>电商</Tag> },
    { key: '认证状态', value: '未认证' },
];

export default function DescriptionsDemo() {
    return <Descriptions data={data} />;
}
