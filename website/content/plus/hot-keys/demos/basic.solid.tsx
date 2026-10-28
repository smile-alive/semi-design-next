import { createSignal } from 'solid-js';
import { HotKeys, Modal } from '@fibrae/semi-ui-solid';

const hotKeys = [HotKeys.Keys.Control, 'Shift', HotKeys.Keys.A];

export default function HotKeysDemo() {
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
        <div>
            <HotKeys hotKeys={hotKeys} onHotKey={showDialog} />
            <Modal title="Dialog" visible={visible()} onOk={handleOk} onCancel={handleCancel}>
                This is the Modal opened by hotkey: {hotKeys.join('+')}.
            </Modal>
        </div>
    );
}
