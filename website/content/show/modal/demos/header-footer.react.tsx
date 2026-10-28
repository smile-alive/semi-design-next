import { useState } from 'react';
import { Modal, Button } from '@fibrae/semi-ui-react';

export default function ModalDemo() {
    const [visible, setVisible] = useState(false);
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
            <Button onClick={showDialog}>自定义页脚样式</Button>
            <Modal
                title="自定义页脚"
                visible={visible}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={
                    <Button type="primary" onClick={handleOk}>
                        Yes, I Understand
                    </Button>
                }
            >
                <p>This is a modal with a customized footer.</p>
                <p>More content...</p>
            </Modal>
        </>
    );
}
