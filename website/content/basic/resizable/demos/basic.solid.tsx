import { createSignal } from 'solid-js';
import { Resizable, Toast } from '@fibrae/semi-ui-solid';

const startToast = {
    content: 'resize start',
    duration: 1,
    stack: true,
};

const endToast = {
    content: 'resize end',
    duration: 1,
    stack: true,
};

export default function ResizableDemo() {
    const [text, setText] = createSignal('Drag edge to resize');
    return (
        <div style={{ width: '500px' }}>
            <Resizable
                style={{ 'background-color': 'var(--semi-grey-1)' }}
                defaultSize={{
                    width: '60%',
                    height: 300,
                }}
                onChange={() => {
                    setText('resizing');
                }}
                onResizeStart={() => {
                    Toast.info(startToast);
                }}
                onResizeEnd={() => {
                    Toast.info(endToast);
                    setText('Drag edge to resize');
                }}
            >
                <div style={{ 'margin-left': '20%' }}>{text()}</div>
            </Resizable>
        </div>
    );
}
