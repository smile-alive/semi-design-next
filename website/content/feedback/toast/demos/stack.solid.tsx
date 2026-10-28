import { Button, Toast } from '@fibrae/semi-ui-solid';

const opts = {
    content: 'Hi, Bytedance dance dance',
    duration: 10,
    stack: true,
};

export default function ToastDemo() {
    return <Button onClick={() => Toast.info(opts)}>多次点击</Button>;
}
