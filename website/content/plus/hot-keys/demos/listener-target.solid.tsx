import { createSignal } from 'solid-js';
import { HotKeys, Input, Modal } from '@fibrae/semi-ui-solid';

const hotKeys = ['Control', 'q'];

export default function HotKeysDemo() {
    const [visible, setVisible] = createSignal(false);
    const [input, setInput] = createSignal<HTMLInputElement>();
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
            <Input inputRef={(node) => setInput(node)} placeholder="test for target" />
            <HotKeys hotKeys={hotKeys} onHotKey={showDialog} getListenerTarget={() => input()} />
            <Modal title="Dialog" visible={visible()} onOk={handleOk} onCancel={handleCancel}>
                This is the Modal opened by hotkey: {hotKeys.join('+')}.
            </Modal>
        </div>
    );
}
