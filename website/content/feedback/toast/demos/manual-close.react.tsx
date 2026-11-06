import { useState } from 'react';
import { Toast, Button } from '@fibrae/semi-ui-react';

export default function ToastDemo() {
    const [toastId, setToastId] = useState<string | null>(null);
    const destroy = () => setToastId(null);
    const opts = {
        content: 'Not auto close',
        duration: 0,
        onClose: destroy,
    };
    const show = () => {
        if (toastId) {
            return;
        }
        setToastId(Toast.info(opts));
    };
    const hide = () => {
        if (toastId) {
            Toast.close(toastId);
        }
        destroy();
    };
    return (
        <>
            <Button type="primary" onClick={show}>
                Show Toast
            </Button>
            <br />
            <br />
            <Button type="primary" onClick={hide}>
                Hide Toast
            </Button>
        </>
    );
}
