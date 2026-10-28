import { Notification, Button } from '@fibrae/semi-ui-react';

export default function NotificationDemo() {
    let opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
    };

    return <Button onClick={() => Notification.info(opts)}>Close After 10s</Button>;
}
