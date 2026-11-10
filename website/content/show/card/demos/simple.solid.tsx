import { IconInfoCircle } from '@fibrae/semi-icons-solid';
import { Avatar, Card, Popover } from '@fibrae/semi-ui-solid';

const bodyStyle = { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' };

export default function CardDemo() {
    return (
        <>
            <Card style={{ 'max-width': '360px' }}>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。</Card>
            <br />
            <Card style={{ 'max-width': '360px' }} bodyStyle={bodyStyle}>
                <Card.Meta title="Semi Doc" avatar={<Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />} />
                <Popover position="top" showArrow content={<article style={{ padding: '6px' }}>这是一个 Card</article>}>
                    <IconInfoCircle aria-label="信息" style={{ color: 'var(--semi-color-primary)' }} />
                </Popover>
            </Card>
        </>
    );
}
