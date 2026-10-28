import { Button, ButtonGroup, Notification } from '@fibrae/semi-ui-solid';

const opts = {
    duration: 3,
    position: 'topRight',
    content: 'semi-ui-notification',
    title: 'Hi bytedance',
} as const;

export default function NotificationDemo() {
    return (
        <>
            <ButtonGroup>
                <Button onClick={() => Notification.info({ ...opts, position: 'top' })}>top</Button>
                <Button onClick={() => Notification.info({ ...opts, position: 'topLeft' })}>topLeft</Button>
                <Button onClick={() => Notification.info(opts)}>topRight</Button>
            </ButtonGroup>
            <br />
            <br />
            <ButtonGroup>
                <Button onClick={() => Notification.info({ ...opts, position: 'bottom' })}>bottom</Button>
                <Button onClick={() => Notification.info({ ...opts, position: 'bottomRight' })}>bottomRight</Button>
                <Button onClick={() => Notification.info({ ...opts, position: 'bottomLeft' })}>bottomLeft</Button>
            </ButtonGroup>
        </>
    );
}
