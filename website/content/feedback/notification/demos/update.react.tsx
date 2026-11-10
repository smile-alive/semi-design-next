import { Notification, Button } from '@fibrae/semi-ui-react';

export default function NotificationDemo() {
    return (
        <Button
            onClick={() => {
                const id = Notification.open({
                    title: 'Hi, Semi',
                    content: 'ies dance dance dance',
                    duration: 3,
                });
                setTimeout(() => {
                    Notification.open({
                        title: 'Hi, Semi',
                        content: 'updated',
                        duration: 10,
                        id,
                    });
                }, 1000);
            }}
        >
            Display Notification
        </Button>
    );
}
