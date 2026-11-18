import { createSignal } from 'solid-js';
import { Button, Spin } from '@fibrae/semi-ui-solid';
import { useSpinDelay } from '@fibrae/semi-ui-solid/primitives';

export default function SpinDemo() {
    const [loading, setLoading] = createSignal(false);
    const visible = useSpinDelay(loading, () => ({ delay: 300, minDuration: 600 }));

    const load = (ms: number) => {
        setLoading(true);
        setTimeout(() => setLoading(false), ms);
    };

    return (
        <div>
            <Button onClick={() => load(200)} style={{ 'margin-inline-end': '12px' }}>
                200ms 的请求
            </Button>
            <Button onClick={() => load(800)} style={{ 'margin-inline-end': '20px' }}>
                800ms 的请求
            </Button>
            <Spin spinning={visible()} />
        </div>
    );
}
