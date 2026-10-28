import { Toast, Button } from '@fibrae/semi-ui-react';

export default function ToastDemo() {
    let opts = {
        content: 'Hi, Bytedance dance dance',
        duration: 3,
    };

    return (
        <>
            <Button style={{ color: `var(--semi-color-success)` }} onClick={() => Toast.success('Hi,Bytedance dance dance')}>
                Success
            </Button>
            <br />
            <br />
            <Button type="warning" onClick={() => Toast.warning(opts)}>
                Warning
            </Button>
            <br />
            <br />
            <Button type="danger" onClick={() => Toast.error(opts)}>
                Error
            </Button>
        </>
    );
}
