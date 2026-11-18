import { createSignal } from 'solid-js';
import { Space, Switch, Typography } from '@fibrae/semi-ui-solid';
import { useScrollLock } from '@fibrae/semi-ui-solid/primitives';

export default function ScrollLockDemo() {
    const [locked, setLocked] = createSignal(false);
    useScrollLock(locked);

    return (
        <Space>
            <Switch checked={locked()} aria-labelledby="scroll-lock-label" onChange={setLocked} />
            <Typography.Text id="scroll-lock-label">锁定页面滚动</Typography.Text>
        </Space>
    );
}
