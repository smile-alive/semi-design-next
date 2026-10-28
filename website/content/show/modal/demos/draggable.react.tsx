import { useState } from 'react';
import { Button, Modal, DragMove } from '@fibrae/semi-ui-react';

export default function ModalDemo() {
    const [visible, setVisible] = useState(false);
    return (
        <div>
            <Button onClick={() => setVisible(true)}>Open Modal</Button>
            <Modal title="可拖拽Modal" visible={visible} centered onCancel={() => setVisible(false)} modalRender={(modal) => <DragMove positionStrategy="relative">{modal}</DragMove>}>
                <p>This is the content of a basic sidesheet.</p>
                <p>Here is more content...</p>
            </Modal>
        </div>
    );
}
