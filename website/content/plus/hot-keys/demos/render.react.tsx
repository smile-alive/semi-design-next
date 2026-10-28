import { useState } from 'react';
import { HotKeys, Modal, Tag } from '@fibrae/semi-ui-react';

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
    const hotKeys = [HotKeys.Keys.Control, HotKeys.Keys.R];

    const newHotKeys = <Tag>Press Ctrl+R to Open Modal</Tag>;
    return (
        <div>
            <HotKeys hotKeys={hotKeys} onHotKey={showDialog} render={newHotKeys} />
            <Modal title="Dialog" visible={visible} onOk={handleOk} onCancel={handleCancel}>
                This is the Modal opened by hotkey: {hotKeys.join('+')}.
            </Modal>
        </div>
    );
}
