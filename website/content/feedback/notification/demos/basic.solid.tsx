import { Button, Notification } from '@fibrae/semi-ui-solid';

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
