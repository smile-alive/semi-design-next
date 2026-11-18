import { useState } from 'react';
import { Button, Spin } from '@fibrae/semi-ui-react';
import { useSpinDelay } from '@fibrae/semi-ui-react/hooks';

export default function SpinDemo() {
    const [loading, setLoading] = useState(false);
    const visible = useSpinDelay(loading, { delay: 300, minDuration: 600 });

    const load = (ms: number) => {
        setLoading(true);
        setTimeout(() => setLoading(false), ms);
    };

    return (
        <div>
            <Button onClick={() => load(200)} style={{ marginInlineEnd: 12 }}>
                200ms 的请求
            </Button>
            <Button onClick={() => load(800)} style={{ marginInlineEnd: 20 }}>
                800ms 的请求
            </Button>
            <Spin spinning={visible} />
        </div>
    );
}
