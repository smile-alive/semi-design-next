import { useState } from 'react';
import { Resizable, Toast } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    const [text, setText] = useState('Drag edge to resize');
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
    return (
        <div style={{ width: '500px' }}>
            <Resizable
                style={{ backgroundColor: 'var(--semi-grey-1)' }}
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
                <div style={{ marginLeft: '20%' }}>{text}</div>
            </Resizable>
        </div>
    );
}
