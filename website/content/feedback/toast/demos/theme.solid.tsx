import { Button, Toast } from '@fibrae/semi-ui-solid';

const opts = {
    content: 'Hi, Bytedance dance dance',
    duration: 3,
    theme: 'light',
} as const;

export default function ToastDemo() {
    return (
        <>
            <Button onClick={() => Toast.info(opts)}>Info</Button>
            <br />
            <br />
            <Button style={{ color: 'var(--semi-color-success)' }} onClick={() => Toast.success(opts)}>
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
