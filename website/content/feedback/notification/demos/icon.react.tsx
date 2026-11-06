import { IconToutiaoLogo, IconVigoLogo } from '@fibrae/semi-icons-react';
import { Notification, Button } from '@fibrae/semi-ui-react';

const opts = {
    title: 'Hi, Bytedance',
    content: 'ies dance dance dance',
    duration: 3,
};

export default function NotificationDemo() {
    return (
        <>
            <h5>默认的图标</h5>
            <Button type="primary" onClick={() => Notification.success(opts)} style={{ margin: 4 }}>
                Success
            </Button>
            <Button onClick={() => Notification.info(opts)} style={{ margin: 4 }}>
                Info
            </Button>
            <Button type="warning" onClick={() => Notification.warning(opts)} style={{ margin: 4 }}>
                Warning
            </Button>
            <Button type="danger" onClick={() => Notification.error(opts)} style={{ margin: 4 }}>
                Error
            </Button>
            <h5>自定义图标</h5>
            <Button
                aria-label="Toutiao 图标通知"
                icon={<IconToutiaoLogo />}
                style={{ marginInlineEnd: 5 }}
                onClick={() =>
                    Notification.info({
                        ...opts,
                        icon: <IconToutiaoLogo style={{ color: 'red' }} />,
                    })
                }
            />
            <Button aria-label="Vigo 图标通知" icon={<IconVigoLogo />} style={{ marginInlineEnd: 5 }} onClick={() => Notification.info({ ...opts, icon: <IconVigoLogo /> })} />
            <Button aria-label="粉色 Vigo 图标通知" icon={<IconVigoLogo />} onClick={() => Notification.info({ ...opts, icon: <IconVigoLogo style={{ color: 'pink' }} /> })} />
        </>
    );
}
