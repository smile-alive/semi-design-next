import { createContext, createSignal, useContext } from 'solid-js';
import { Button, Notification, Space } from '@fibrae/semi-ui-solid';

const ReachableContext = createContext<string>();

// The holder must be created under the Provider: its notifications read the context around it
function HookDemo() {
    const [notification, contextHolder] = Notification.useNotification();
    const [ids, setIds] = createSignal<string[]>([]);

    function show() {
        const id = notification.info({
            title: 'Hook Notification',
            // A function is called where the notice renders, so it reads the context around contextHolder
            content: () => `ReachableContext: ${useContext(ReachableContext)}`,
            duration: 0,
        });
        setIds([...ids(), id]);
    }

    function hide() {
        const [first, ...rest] = ids();
        if (first) {
            notification.close(first);
        }
        setIds(rest);
    }

    return (
        <>
            <Space>
                <Button onClick={show}>Show Notification</Button>
                <Button onClick={hide}>Hide Notification</Button>
            </Space>
            {contextHolder}
        </>
    );
}

export default function NotificationDemo() {
    return (
        <ReachableContext.Provider value="Light">
            <HookDemo />
        </ReachableContext.Provider>
    );
}
