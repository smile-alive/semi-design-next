import { useState } from 'react';
import { Typography } from '@fibrae/semi-ui-react';
import { useHotKeys } from '@fibrae/semi-ui-react/hooks';

export default function HotKeysDemo() {
    const [count, setCount] = useState(0);
    useHotKeys(['Control', 'k'], () => setCount((prev) => prev + 1), { preventDefault: true });

    return <Typography.Text>按下 Ctrl + K 的次数：{count}</Typography.Text>;
}
