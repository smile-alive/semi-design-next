import { IconBell, IconHome } from '@fibrae/semi-icons-solid';
import { Button, Notification } from '@fibrae/semi-ui-solid';

const opts = {
    title: 'Hi, Semi',
    content: 'ies dance dance dance',
    duration: 3,
};

export default function NotificationDemo() {
    return (
        <>
            <h5>默认的图标</h5>
            <Button type="primary" onClick={() => Notification.success(opts)} style={{ margin: '4px' }}>
                Success
            </Button>
            <Button onClick={() => Notification.info(opts)} style={{ margin: '4px' }}>
                Info
            </Button>
            <Button type="warning" onClick={() => Notification.warning(opts)} style={{ margin: '4px' }}>
                Warning
            </Button>
            <Button type="danger" onClick={() => Notification.error(opts)} style={{ margin: '4px' }}>
                Error
            </Button>
            <h5>自定义图标</h5>
            <Button
                aria-label="铃铛图标通知"
                icon={<IconBell />}
                style={{ 'margin-inline-end': '5px' }}
                onClick={() =>
                    Notification.info({
                        ...opts,
                        icon: <IconBell style={{ color: 'red' }} />,
                    })
                }
            />
            <Button aria-label="主页图标通知" icon={<IconHome />} style={{ 'margin-inline-end': '5px' }} onClick={() => Notification.info({ ...opts, icon: <IconHome /> })} />
            <Button aria-label="粉色主页图标通知" icon={<IconHome />} onClick={() => Notification.info({ ...opts, icon: <IconHome style={{ color: 'pink' }} /> })} />
        </>
    );
}
