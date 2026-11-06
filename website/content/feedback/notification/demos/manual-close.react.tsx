import { useState } from 'react';
import { Notification, Button } from '@fibrae/semi-ui-react';

const opts = {
    content: 'Not auto close',
    title: 'Hi',
    duration: 0,
};

export default function NotificationDemo() {
    const [ids, setIds] = useState<string[]>([]);
    const show = () => {
        let id = Notification.info(opts);
        setIds([...ids, id]);
    };
    const hide = () => {
        let idsTmp = [...ids];
        const first = idsTmp.shift();
        if (first) {
            Notification.close(first);
        }
        setIds(idsTmp);
    };
    return (
        <>
            <Button type="primary" onClick={show}>
                Show Notification
            </Button>
            <br />
            <br />
            <Button type="primary" onClick={hide}>
                Hide Notification
            </Button>
        </>
    );
}
