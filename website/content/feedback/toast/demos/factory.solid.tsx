import { onCleanup } from 'solid-js';
import { Button, Toast, ToastFactory } from '@fibrae/semi-ui-solid';

const ToastInCustomContainer = ToastFactory.create({
    getPopupContainer: () => document.getElementById('custom-toast-container') as HTMLElement,
});

export default function ToastDemo() {
    onCleanup(() => ToastInCustomContainer.destroyAll());

    return (
        <div>
            <Button onClick={() => Toast.info('Toast')}>Default Toast</Button>
            <br />
            <br />
            <Button onClick={() => ToastInCustomContainer.info('Toast in some container')}>Toast in custom container</Button>
            <div id="custom-toast-container">custom container</div>
        </div>
    );
}
