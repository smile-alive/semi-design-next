import { createContext, useState } from 'react';
import { Notification, Button, Space } from '@fibrae/semi-ui-react';

const ReachableContext = createContext('');

export default function NotificationDemo() {
    const [notification, contextHolder] = Notification.useNotification();
    const [ids, setIds] = useState<string[]>([]);

    function show() {
        const id = notification.info({
            title: 'Hook Notification',
            content: <ReachableContext.Consumer>{(name) => `ReachableContext: ${name}`}</ReachableContext.Consumer>,
            duration: 0,
        });
        setIds([...ids, id]);
    }

    function hide() {
        const [first, ...rest] = ids;
        if (first) {
            notification.close(first);
        }
        setIds(rest);
    }

    return (
        <ReachableContext.Provider value="Light">
            <Space>
                <Button onClick={show}>Show Notification</Button>
                <Button onClick={hide}>Hide Notification</Button>
            </Space>
            {contextHolder}
        </ReachableContext.Provider>
    );
}
