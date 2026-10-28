import { createSignal } from 'solid-js';
import { Button, Toast } from '@fibrae/semi-ui-solid';

export default function ToastDemo() {
    const [toastId, setToastId] = createSignal<string | null>(null);

    const show = () => {
        if (toastId()) {
            return;
        }
        setToastId(Toast.info({ content: 'Not auto close', duration: 0, onClose: () => setToastId(null) }));
    };
    const hide = () => {
        const id = toastId();
        if (id) {
            Toast.close(id);
        }
        setToastId(null);
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
