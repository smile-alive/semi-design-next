import { useState } from 'react';
import { Toast, Button } from '@fibrae/semi-ui-react';

export default function ToastDemo() {
    const [toastId, setToastId] = useState<string | null>(null);
    const show = () => {
        if (toastId) {
            return;
        }
        let id = Toast.info(opts);
        setToastId(id);
    };
    const hide = () => {
        if (toastId) {
            Toast.close(toastId);
        }
        destroy();
    };
    const destroy = () => setToastId(null);
    let opts = {
        content: 'Not auto close',
        duration: 0,
        onClose: destroy,
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
