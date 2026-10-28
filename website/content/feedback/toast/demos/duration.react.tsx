import { Toast, Button } from '@fibrae/semi-ui-react';

export default function ToastDemo() {
    let opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
    };

    return <Button onClick={() => Toast.info(opts)}>Close After 10s</Button>;
}
