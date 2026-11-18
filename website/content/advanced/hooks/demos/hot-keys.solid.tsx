import { createSignal } from 'solid-js';
import { Typography } from '@fibrae/semi-ui-solid';
import { useHotKeys } from '@fibrae/semi-ui-solid/primitives';

export default function HotKeysDemo() {
    const [count, setCount] = createSignal(0);
    useHotKeys(
        () => ['Control', 'k'],
        () => setCount((prev) => prev + 1),
        () => ({ preventDefault: true })
    );

    return <Typography.Text>按下 Ctrl + K 的次数：{count()}</Typography.Text>;
}
