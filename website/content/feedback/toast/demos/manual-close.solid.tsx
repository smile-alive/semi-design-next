import { createSignal } from 'solid-js';
import { Button, Toast } from '@fibrae/semi-ui-solid';

export default function ToastDemo() {
    const [toastId, setToastId] = createSignal<string | null>(null);

    const destroy = () => setToastId(null);

    const opts = {
        content: 'Not auto close',
        duration: 0,
        onClose: destroy,
    };

    const show = () => {
        if (toastId()) {
            return;
        }
        setToastId(Toast.info(opts));
    };
    const hide = () => {
        const id = toastId();
        if (id) {
            Toast.close(id);
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
