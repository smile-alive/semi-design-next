import { createSignal } from 'solid-js';
import { Button, Space, Typography } from '@fibrae/semi-ui-solid';
import { useAnnouncer } from '@fibrae/semi-ui-solid/primitives';

export default function AnnouncerDemo() {
    const [count, setCount] = createSignal(0);
    const announce = useAnnouncer();

    const add = () => {
        const next = count() + 1;
        setCount(next);
        announce(`已加入购物车，共 ${next} 件`);
    };

    return (
        <Space spacing="loose">
            <Button onClick={add}>加入购物车</Button>
            <Typography.Text>购物车：{count()} 件</Typography.Text>
        </Space>
    );
}
