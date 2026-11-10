import { Notification, Button } from '@fibrae/semi-ui-react';

const opts = {
    content: 'Hi, Semi dance dance',
    duration: 10,
};

export default function NotificationDemo() {
    return <Button onClick={() => Notification.info(opts)}>Close After 10s</Button>;
}
