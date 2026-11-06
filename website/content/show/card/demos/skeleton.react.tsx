import { useState } from 'react';
import { Card, Switch, Skeleton, Avatar, Typography } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    const [loading, setLoading] = useState(true);

    return (
        <>
            <Switch aria-label="显示内容" onChange={(v) => setLoading(!v)} />
            <br />
            <br />
            <Card
                style={{ maxWidth: 300 }}
                title={
                    <Card.Meta
                        title={
                            <Skeleton style={{ width: 80 }} placeholder={<Skeleton.Title />} loading={loading}>
                                <Typography.Title heading={5}>Semi Doc</Typography.Title>
                            </Skeleton>
                        }
                        description={
                            <Skeleton style={{ width: 150, marginTop: 12 }} placeholder={<Skeleton.Paragraph rows={1} />} loading={loading}>
                                <Typography.Text>全面、易用、优质</Typography.Text>
                            </Skeleton>
                        }
                        avatar={
                            <Skeleton placeholder={<Skeleton.Avatar />} loading={loading}>
                                <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
                            </Skeleton>
                        }
                    />
                }
                headerExtraContent={
                    <Skeleton style={{ width: 50 }} placeholder={<Skeleton.Paragraph rows={1} />} loading={loading}>
                        <Typography.Text link>More</Typography.Text>
                    </Skeleton>
                }
                cover={
                    <Skeleton style={{ maxWidth: '100%', height: 220 }} placeholder={<Skeleton.Image />} loading={loading}>
                        <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
                    </Skeleton>
                }
            />
        </>
    );
}
