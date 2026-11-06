import { createSignal } from 'solid-js';
import { Avatar, Card, Skeleton, Switch, Typography } from '@fibrae/semi-ui-solid';

export default function CardDemo() {
    const [loading, setLoading] = createSignal(true);

    return (
        <>
            <Switch aria-label="显示内容" onChange={(v) => setLoading(!v)} />
            <br />
            <br />
            <Card
                style={{ 'max-width': '300px' }}
                title={
                    <Card.Meta
                        title={
                            <Skeleton style={{ width: '80px' }} placeholder={<Skeleton.Title />} loading={loading()}>
                                <Typography.Title heading={5}>Semi Doc</Typography.Title>
                            </Skeleton>
                        }
                        description={
                            <Skeleton style={{ width: '150px', 'margin-top': '12px' }} placeholder={<Skeleton.Paragraph rows={1} />} loading={loading()}>
                                <Typography.Text>全面、易用、优质</Typography.Text>
                            </Skeleton>
                        }
                        avatar={
                            <Skeleton placeholder={<Skeleton.Avatar />} loading={loading()}>
                                <Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />
                            </Skeleton>
                        }
                    />
                }
                headerExtraContent={
                    <Skeleton style={{ width: '50px' }} placeholder={<Skeleton.Paragraph rows={1} />} loading={loading()}>
                        <Typography.Text link>More</Typography.Text>
                    </Skeleton>
                }
                cover={
                    <Skeleton style={{ 'max-width': '100%', height: '220px' }} placeholder={<Skeleton.Image />} loading={loading()}>
                        <img alt="example" src="/assets/root-web-sites/card-cover-docs-demo.jpeg" />
                    </Skeleton>
                }
            />
        </>
    );
}
