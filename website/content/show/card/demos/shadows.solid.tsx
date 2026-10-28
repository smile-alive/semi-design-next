import { IconInfoCircle } from '@fibrae/semi-icons-solid';
import { Avatar, Card, Popover } from '@fibrae/semi-ui-solid';

const avatarSrc = '/assets/placeholder/logo.svg';
const bodyStyle = { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' };

export default function CardDemo() {
    return (
        <div>
            <Card shadows="hover" style={{ 'max-width': '360px' }} bodyStyle={bodyStyle}>
                <Card.Meta title="Semi Doc" avatar={<Avatar alt="Card meta img" size="default" src={avatarSrc} />} />
                <Popover position="top" showArrow content={<article style={{ padding: '6px' }}>这是一个 Card</article>}>
                    <IconInfoCircle aria-label="信息" style={{ color: 'var(--semi-color-primary)' }} />
                </Popover>
            </Card>
            <br />
            <Card shadows="always" style={{ 'max-width': '360px' }} bodyStyle={bodyStyle}>
                <Card.Meta title="Semi Doc" avatar={<Avatar alt="Card meta img" size="default" src={avatarSrc} />} />
                <Popover position="top" showArrow content={<article style={{ padding: '6px' }}>这是一个 Card</article>}>
                    <IconInfoCircle aria-label="信息" style={{ color: 'var(--semi-color-primary)' }} />
                </Popover>
            </Card>
        </div>
    );
}
