import { useState } from 'react';
import { HotKeys, Modal } from '@fibrae/semi-ui-react';

export default function HotKeysDemo() {
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
    const hotKeys = [HotKeys.Keys.Control, 'Shift', HotKeys.Keys.A];

    return (
        <div>
            <HotKeys hotKeys={hotKeys} onHotKey={showDialog} />
            <Modal title="Dialog" visible={visible} onOk={handleOk} onCancel={handleCancel}>
                This is the Modal opened by hotkey: {hotKeys.join('+')}.
            </Modal>
        </div>
    );
}
