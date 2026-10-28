import { createSignal } from 'solid-js';
import { Button, Modal } from '@fibrae/semi-ui-solid';

export default function ModalDemo() {
    const [visible, setVisible] = createSignal(false);
    const showDialog = () => {
        setVisible(true);
    };
    const handleOk = () => {
        setVisible(false);
    };
    const handleCancel = () => {
        setVisible(false);
    };
    return (
        <>
            <Button onClick={showDialog}>自定义按钮文字</Button>
            <Modal title="自定义按钮文字" visible={visible()} onOk={handleOk} onCancel={handleCancel} okText="Sounds great!" cancelText="No, thanks.">
                <p>This is a modal with customized button texts.</p>
                <p>More content...</p>
            </Modal>
        </>
    );
}
