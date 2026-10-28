import { Button, Notification } from '@fibrae/semi-ui-solid';

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
