import { Button, Notification } from '@fibrae/semi-ui-solid';

const opts = {
    content: 'Hi, Bytedance dance dance',
    duration: 10,
};

export default function NotificationDemo() {
    return <Button onClick={() => Notification.info(opts)}>Close After 10s</Button>;
}
