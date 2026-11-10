import { IconBell, IconHome } from '@fibrae/semi-icons-react';
import { Notification, Button } from '@fibrae/semi-ui-react';

const opts = {
    title: 'Hi, Semi',
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
                aria-label="铃铛图标通知"
                icon={<IconBell />}
                style={{ marginInlineEnd: 5 }}
                onClick={() =>
                    Notification.info({
                        ...opts,
                        icon: <IconBell style={{ color: 'red' }} />,
                    })
                }
            />
            <Button aria-label="主页图标通知" icon={<IconHome />} style={{ marginInlineEnd: 5 }} onClick={() => Notification.info({ ...opts, icon: <IconHome /> })} />
            <Button aria-label="粉色主页图标通知" icon={<IconHome />} onClick={() => Notification.info({ ...opts, icon: <IconHome style={{ color: 'pink' }} /> })} />
        </>
    );
}
