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
            <Button onClick={showDialog}>点击遮罩层不可关闭</Button>
            <Modal title="对话框标题" visible={visible()} onOk={handleOk} onCancel={handleCancel} maskClosable={false}>
                <p>This is a modal that cannot be closed by clicking on the mask.</p>
                <p>More content...</p>
            </Modal>
        </>
    );
}
