import { useState } from 'react';
import { Modal, Button } from '@fibrae/semi-ui-react';

export default function ModalDemo() {
    const [visible, setVisible] = useState(false);
    const showDialog = () => {
        setVisible(true);
    };
    const handleOk = () => {
        setVisible(false);
        console.log('Ok button clicked');
    };
    const handleCancel = () => {
        setVisible(false);
        console.log('Cancel button clicked');
    };
    const handleAfterClose = () => {
        console.log('After Close callback executed');
    };

    return (
        <>
            <Button onClick={showDialog}>打开弹窗</Button>
            <Modal title="基本对话框" visible={visible} onOk={handleOk} afterClose={handleAfterClose} onCancel={handleCancel} closeOnEsc>
                This is the content of a basic modal.
                <br />
                More content...
            </Modal>
        </>
    );
}
