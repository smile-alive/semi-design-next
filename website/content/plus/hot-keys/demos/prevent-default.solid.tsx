import { createSignal } from 'solid-js';
import { HotKeys, Modal } from '@fibrae/semi-ui-solid';

const metaKeys = [HotKeys.Keys.Meta, HotKeys.Keys.S];
const controlKeys = [HotKeys.Keys.Control, HotKeys.Keys.S];

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
            <HotKeys hotKeys={metaKeys} onHotKey={showDialog} preventDefault />
            <br />
            <HotKeys hotKeys={controlKeys} onHotKey={showDialog} preventDefault />
            <Modal title="Dialog" visible={visible()} onOk={handleOk} onCancel={handleCancel}>
                This is the Modal opened by hotkey: Meta/Control + S.
            </Modal>
        </div>
    );
}
