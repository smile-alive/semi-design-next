import { Toast, Button } from '@fibrae/semi-ui-react';

const opts = {
    content: 'Hi, Semi dance dance',
    duration: 10,
};

export default function ToastDemo() {
    return <Button onClick={() => Toast.info(opts)}>Close After 10s</Button>;
}
