import { createSignal } from 'solid-js';
import { Button, Modal } from '@fibrae/semi-ui-solid';

export default function ModalDemo() {
    const [visible, setVisible] = createSignal(false);
    const onClose = () => {
        setVisible(false);
    };
    return (
        <>
            <Button onClick={() => setVisible(true)}>打开全屏弹窗</Button>
            <Modal title="全屏对话框标题" fullScreen visible={visible()} onOk={onClose} onCancel={onClose}>
                <p>This is a full screen modal</p>
                <p>More content...</p>
            </Modal>
        </>
    );
}
