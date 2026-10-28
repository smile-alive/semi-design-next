import { Button, Toast } from '@fibrae/semi-ui-solid';

const opts = {
    content: 'Hi, Bytedance dance dance',
    duration: 10,
};

export default function ToastDemo() {
    return <Button onClick={() => Toast.info(opts)}>Close After 10s</Button>;
}
