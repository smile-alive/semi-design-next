import { Toast, Button } from '@fibrae/semi-ui-react';

export default function ToastDemo() {
    function show() {
        const id = 'toastid';
        Toast.info({ content: 'Update Content By Id', id });
        setTimeout(() => {
            Toast.success({ content: 'Id By Content Update', id });
        }, 1000);
    }

    return (
        <Button type="primary" onClick={show}>
            Update Content By Id
        </Button>
    );
}
