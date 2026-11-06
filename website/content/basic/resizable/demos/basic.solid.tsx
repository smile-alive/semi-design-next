import { createSignal } from 'solid-js';
import { Resizable, Toast } from '@fibrae/semi-ui-solid';

const opts_1 = {
    content: 'resize start',
    duration: 1,
    stack: true,
};
const opts_2 = {
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
                    Toast.info(opts_1);
                }}
                onResizeEnd={() => {
                    Toast.info(opts_2);
                    setText('Drag edge to resize');
                }}
            >
                <div style={{ 'margin-inline-start': '20%' }}>{text()}</div>
            </Resizable>
        </div>
    );
}
