import { Toast, Button } from '@fibrae/semi-ui-react';

export default function ToastDemo() {
    const opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 10,
        stack: true,
    };

    return (
        <Button
            onClick={() => {
                Toast.info(opts);
            }}
        >
            多次点击
        </Button>
    );
}
