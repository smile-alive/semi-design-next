import { IconInfoCircle } from '@fibrae/semi-icons-react';
import { Card, Avatar, Popover } from '@fibrae/semi-ui-react';

const styles = { body: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } };

export default function CardDemo() {
    return (
        <div>
            <Card shadows="hover" style={{ maxWidth: 360 }} styles={styles}>
                <Card.Meta title="Semi Doc" avatar={<Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />} />
                <Popover position="top" showArrow content={<article style={{ padding: 6 }}>这是一个 Card</article>}>
                    <IconInfoCircle aria-label="信息" style={{ color: 'var(--semi-color-primary)' }} />
                </Popover>
            </Card>
            <br />
            <Card shadows="always" style={{ maxWidth: 360 }} styles={styles}>
                <Card.Meta title="Semi Doc" avatar={<Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />} />
                <Popover position="top" showArrow content={<article style={{ padding: 6 }}>这是一个 Card</article>}>
                    <IconInfoCircle aria-label="信息" style={{ color: 'var(--semi-color-primary)' }} />
                </Popover>
            </Card>
        </div>
    );
}
