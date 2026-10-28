import { throttle } from 'es-toolkit';
import { Toast, Button } from '@fibrae/semi-ui-react';

export default function ToastDemo() {
    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 3,
        stack: true,
    };

    const handleClose = () => {
        throttled.cancel();
    };
    const throttleOpts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
        onClose: handleClose,
        stack: true,
    };
    const throttled = throttle(() => Toast.info(throttleOpts), 10000, { edges: ['leading'] });

    return (
        <div>
            <Button onClick={() => Toast.info(opts)}>Display Toast</Button>
            <br />
            <br />
            <Button onClick={throttled}>Throttled Toast</Button>
        </div>
    );
}
