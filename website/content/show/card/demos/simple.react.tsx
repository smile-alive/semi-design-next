import { IconInfoCircle } from '@fibrae/semi-icons-react';
import { Card, Popover, Avatar } from '@fibrae/semi-ui-react';

const styles = { body: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } };

export default function CardDemo() {
    return (
        <>
            <Card style={{ maxWidth: 360 }}>Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。</Card>
            <br />
            <Card style={{ maxWidth: 360 }} styles={styles}>
                <Card.Meta title="Semi Doc" avatar={<Avatar alt="Card meta img" size="default" src="/assets/placeholder/logo.svg" />} />
                <Popover position="top" showArrow content={<article style={{ padding: 6 }}>这是一个 Card</article>}>
                    <IconInfoCircle aria-label="信息" style={{ color: 'var(--semi-color-primary)' }} />
                </Popover>
            </Card>
        </>
    );
}
