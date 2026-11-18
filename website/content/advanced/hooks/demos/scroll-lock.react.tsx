import { useState } from 'react';
import { Space, Switch, Typography } from '@fibrae/semi-ui-react';
import { useScrollLock } from '@fibrae/semi-ui-react/hooks';

export default function ScrollLockDemo() {
    const [locked, setLocked] = useState(false);
    useScrollLock(locked);

    return (
        <Space>
            <Switch checked={locked} aria-labelledby="scroll-lock-label" onChange={setLocked} />
            <Typography.Text id="scroll-lock-label">锁定页面滚动</Typography.Text>
        </Space>
    );
}
