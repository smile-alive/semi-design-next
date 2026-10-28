import { Descriptions, Tag, Card } from '@fibrae/semi-ui-react';

export default function DescriptionsDemo() {
    const data = [
        { key: '实际用户数量', value: '1,480,000' },
        { key: '7天留存', value: '98%' },
        { key: '安全等级', value: '3级' },
        { key: '垂类标签', value: <Tag style={{ margin: 0 }}>电商</Tag> },
        { key: '认证状态', value: '未认证' },
    ];
    const style = {
        margin: '10px',
    };
    return (
        <>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <Card shadows="always" style={style}>
                    <Descriptions align="center" data={data} />
                </Card>
                <Card shadows="always" style={style}>
                    <Descriptions align="justify" data={data} />
                </Card>
                <Card shadows="always" style={style}>
                    <Descriptions align="left" data={data} />
                </Card>
                <Card shadows="always" style={style}>
                    <Descriptions align="plain" data={data} />
                </Card>
            </div>
        </>
    );
}
