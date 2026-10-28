import { IconInfoCircle } from '@fibrae/semi-icons-react';
import { Card, Popover, Avatar } from '@fibrae/semi-ui-react';

export default function CardDemo() {
    const { Meta } = Card;

    return (
        <>
            <Card style={{ maxWidth: 360 }}>Semi Design 是由抖音前端团队与 UED 团队共同设计开发并维护的设计系统。</Card>
            <br />
            <Card
                style={{ maxWidth: 360 }}
                bodyStyle={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Meta title="Semi Doc" avatar={<Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />} />
                <Popover position="top" showArrow content={<article style={{ padding: 6 }}>这是一个 Card</article>}>
                    <IconInfoCircle aria-label="信息" style={{ color: 'var(--semi-color-primary)' }} />
                </Popover>
            </Card>
        </>
    );
}
