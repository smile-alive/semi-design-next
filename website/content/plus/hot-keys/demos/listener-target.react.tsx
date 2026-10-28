import { useState, useRef } from 'react';
import { HotKeys, Input, Modal, type InputHandle } from '@fibrae/semi-ui-react';

export default function HotKeysDemo() {
    const hotKeys = ['Control', 'q'];
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

    const inputRef = useRef<InputHandle>(null);
    return (
        <div>
            <Input ref={inputRef} placeholder="test for target" />
            <HotKeys hotKeys={hotKeys} onHotKey={showDialog} getListenerTarget={() => inputRef.current?.input} />
            <Modal title="Dialog" visible={visible} onOk={handleOk} onCancel={handleCancel}>
                This is the Modal opened by hotkey: {hotKeys.join('+')}.
            </Modal>
        </div>
    );
}
