import { createSignal } from 'solid-js';
import { Button, Notification } from '@fibrae/semi-ui-solid';

const opts = {
    content: 'Not auto close',
    title: 'Hi',
    duration: 0,
};

export default function NotificationDemo() {
    const [ids, setIds] = createSignal<string[]>([]);

    function show() {
        const id = Notification.info(opts);
        setIds([...ids(), id]);
    }

    function hide() {
        const [first, ...rest] = ids();
        if (first) {
            Notification.close(first);
        }
        setIds(rest);
    }

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
