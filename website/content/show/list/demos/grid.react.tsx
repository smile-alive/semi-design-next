import { List, Descriptions, ButtonGroup, Rating, Button } from '@fibrae/semi-ui-react';

export default function ListDemo() {
    const data = [
        {
            title: 'Semi UI',
            rating: 4.5,
            feedbacks: 124,
        },
        {
            title: 'Semi DSM',
            rating: 4,
            feedbacks: 108,
        },
        {
            title: 'Semi D2C',
            rating: 4.5,
            feedbacks: 244,
        },
    ];

    const style = {
        border: '1px solid var(--semi-color-border)',
        backgroundColor: 'var(--semi-color-bg-2)',
        borderRadius: '3px',
        paddingLeft: '20px',
    };

    return (
        <div>
            <List
                grid={{
                    gutter: 12,
                    span: 6,
                }}
                dataSource={data}
                renderItem={(item) => (
                    <List.Item style={style}>
                        <div>
                            <h3 style={{ color: 'var(--semi-color-text-0)', fontWeight: 500 }}>{item.title}</h3>
                            <Descriptions
                                align="center"
                                size="small"
                                row
                                data={[
                                    { key: '满意度', value: <Rating allowHalf size="small" value={item.rating} /> },
                                    { key: '反馈数', value: item.feedbacks },
                                ]}
                            />
                            <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
                                <ButtonGroup theme="borderless" style={{ marginTop: 8 }}>
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
