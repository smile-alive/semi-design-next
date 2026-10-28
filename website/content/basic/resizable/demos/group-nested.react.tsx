import { useState } from 'react';
import { ResizeItem, ResizeHandler, ResizeGroup, Toast } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    const [text, setText] = useState('Drag to resize');
    const opts_1 = {
        content: 'resize start',
        duration: 1,
        stack: true,
    };
    const opts = {
        content: 'resize end',
        duration: 1,
        stack: true,
    };
    return (
        <div style={{ width: '1000px', height: '600px' }}>
            <ResizeGroup direction="vertical">
                <ResizeItem
                    style={{ backgroundColor: 'var(--semi-grey-1)' }}
                    defaultSize="20%"
                    onChange={() => {
                        setText('resizing');
                    }}
                    onResizeStart={() => {
                        Toast.info(opts_1);
                    }}
                    onResizeEnd={() => {
                        Toast.info(opts);
                        setText('Drag to resize');
                    }}
                >
                    <div style={{ marginLeft: '20%' }}>header</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    defaultSize="80%"
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <ResizeGroup direction="horizontal">
                        <ResizeItem
                            style={{
                                backgroundColor: 'var(--semi-grey-1)',
                                border: 'var(--semi-color-border) 1px solid',
                            }}
                            defaultSize="25%"
                            onChange={() => {
                                setText('resizing');
                            }}
                            onResizeStart={() => {
                                Toast.info(opts_1);
                            }}
                            onResizeEnd={() => {
                                Toast.info(opts);
                                setText('Drag to resize');
                            }}
                        >
                            <div style={{ marginLeft: '20%' }}>tab</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem
                            style={{
                                backgroundColor: 'var(--semi-grey-1)',
                                border: 'var(--semi-color-border) 1px solid',
                            }}
                            defaultSize="75%"
                            onChange={() => {
                                setText('resizing');
                            }}
                        >
                            <div style={{ marginLeft: '20%' }}>{text}</div>
                        </ResizeItem>
                    </ResizeGroup>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
