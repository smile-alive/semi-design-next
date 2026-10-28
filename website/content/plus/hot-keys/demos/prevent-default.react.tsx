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
    const hotKeys = [HotKeys.Keys.Meta, HotKeys.Keys.S];

    return (
        <div>
            <HotKeys hotKeys={hotKeys} onHotKey={showDialog} preventDefault />
            <br />
            <HotKeys hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.S]} onHotKey={showDialog} preventDefault />
            <Modal title="Dialog" visible={visible} onOk={handleOk} onCancel={handleCancel}>
                This is the Modal opened by hotkey: Meta/Control + S.
            </Modal>
        </div>
    );
}
