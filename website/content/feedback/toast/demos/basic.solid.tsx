import { throttle } from 'es-toolkit';
import { Button, Toast } from '@fibrae/semi-ui-solid';

const opts = {
    content: 'Hi, Bytedance dance dance',
    duration: 3,
    stack: true,
};

export default function ToastDemo() {
    const throttled = throttle(
        () =>
            Toast.info({
                content: 'Hi, Bytedance dance dance',
                duration: 10,
                onClose: () => throttled.cancel(),
                stack: true,
            }),
        10000,
        { edges: ['leading'] }
    );

    return (
        <div>
            <Button onClick={() => Toast.info(opts)}>Display Toast</Button>
            <br />
            <br />
            <Button onClick={throttled}>Throttled Toast</Button>
        </div>
    );
}
