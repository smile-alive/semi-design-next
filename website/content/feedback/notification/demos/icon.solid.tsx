import { IconToutiaoLogo, IconVigoLogo } from '@fibrae/semi-icons-solid';
import { Button, Notification } from '@fibrae/semi-ui-solid';

const opts = {
    title: 'Hi, Bytedance',
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
                aria-label="Toutiao 图标通知"
                icon={<IconToutiaoLogo />}
                style={{ 'margin-right': '5px' }}
                onClick={() =>
                    Notification.info({
                        ...opts,
                        icon: <IconToutiaoLogo style={{ color: 'red' }} />,
                    })
                }
            />
            <Button aria-label="Vigo 图标通知" icon={<IconVigoLogo />} style={{ 'margin-right': '5px' }} onClick={() => Notification.info({ ...opts, icon: <IconVigoLogo /> })} />
            <Button aria-label="粉色 Vigo 图标通知" icon={<IconVigoLogo />} onClick={() => Notification.info({ ...opts, icon: <IconVigoLogo style={{ color: 'pink' }} /> })} />
        </>
    );
}
