import { Notification, Button } from '@fibrae/semi-ui-react';

export default function NotificationDemo() {
    return (
        <Button
            onClick={() =>
                Notification.open({
                    title: 'Hi, Bytedance',
                    content: 'ies dance dance dance',
                    duration: 3,
                })
            }
        >
            Display Notification
        </Button>
    );
}
