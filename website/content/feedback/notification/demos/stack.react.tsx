import { Notification, Button } from '@fibrae/semi-ui-react';

export default function NotificationDemo() {
    return (
        <Button
            onClick={() => {
                Notification.info({ title: 'Hi', content: 'Hi, Bytedance dance dance', duration: 10, stack: true });
            }}
        >
            Click multiple times
        </Button>
    );
}
