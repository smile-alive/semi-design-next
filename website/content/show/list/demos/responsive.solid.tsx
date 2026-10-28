import { Button, ButtonGroup, Descriptions, type DescriptionsData, List, Rating } from '@fibrae/semi-ui-solid';

const data = [
    {
        title: '审核管理平台',
        rating: 4.5,
        feedbacks: 124,
    },
    {
        title: '扁鹊',
        rating: 4,
        feedbacks: 108,
    },
    {
        title: '直播审核平台',
        rating: 3.5,
        feedbacks: 244,
    },
    {
        title: '抖音安全测试',
        feedbacks: 189,
    },
    {
        title: '内容平台',
        rating: 3,
        feedbacks: 128,
    },
    {
        title: '策略平台',
        rating: 4,
        feedbacks: 156,
    },
];

const style = {
    border: '1px solid var(--semi-color-border)',
    'background-color': 'var(--semi-color-bg-2)',
    'border-radius': '3px',
    'padding-left': '20px',
    margin: '8px 2px',
};

const renderStat = (stat: DescriptionsData, index: number) => (index === 0 ? <Rating allowHalf size="small" value={typeof stat.value === 'number' ? stat.value : undefined} /> : stat.value);

export default function ListDemo() {
    return (
        <div>
            <List
                grid={{
                    gutter: 12,
                    xs: 0,
                    sm: 0,
                    md: 12,
                    lg: 8,
                    xl: 8,
                    xxl: 6,
                }}
                dataSource={data}
                renderItem={(item) => (
                    <List.Item style={style}>
                        <div>
                            <h3 style={{ color: 'var(--semi-color-text-0)', 'font-weight': '500' }}>{item.title}</h3>
                            <Descriptions
                                align="center"
                                size="small"
                                row
                                data={[
                                    { key: '满意度', value: item.rating },
                                    { key: '反馈数', value: item.feedbacks },
                                ]}
                                renderValue={renderStat}
                            />
                            <div style={{ margin: '12px 0', display: 'flex', 'justify-content': 'flex-end' }}>
                                <ButtonGroup theme="borderless" style={{ 'margin-top': '8px' }}>
                                    <Button>编辑</Button>
                                    <Button>更多</Button>
                                </ButtonGroup>
                            </div>
                        </div>
                    </List.Item>
                )}
            />
        </div>
    );
}
