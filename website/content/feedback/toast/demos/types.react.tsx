import { Toast, Button } from '@fibrae/semi-ui-react';

const opts = {
    content: 'Hi, Semi dance dance',
    duration: 3,
};

export default function ToastDemo() {
    return (
        <>
            <Button style={{ color: 'var(--semi-color-success)' }} onClick={() => Toast.success('Hi,Semi dance dance')}>
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
