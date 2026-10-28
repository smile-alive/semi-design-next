import { createSignal } from 'solid-js';
import { Button, DragMove, Modal } from '@fibrae/semi-ui-solid';

export default function ModalDemo() {
    const [visible, setVisible] = createSignal(false);
    return (
        <div>
            <Button onClick={() => setVisible(true)}>Open Modal</Button>
            <Modal title="可拖拽Modal" visible={visible()} centered onCancel={() => setVisible(false)} modalRender={(modal) => <DragMove positionStrategy="relative">{modal}</DragMove>}>
                <p>This is the content of a basic sidesheet.</p>
                <p>Here is more content...</p>
            </Modal>
        </div>
    );
}
