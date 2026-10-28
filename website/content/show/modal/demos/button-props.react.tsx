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
            <Button onClick={showDialog}>自定义按钮属性</Button>
            <Modal title="自定义按钮属性" visible={visible} onOk={handleOk} onCancel={handleCancel} okButtonProps={{ size: 'small', type: 'warning' }} cancelButtonProps={{ size: 'small', disabled: true }}>
                <p>This is a modal with customized button props.</p>
                <p>More content...</p>
            </Modal>
        </>
    );
}
