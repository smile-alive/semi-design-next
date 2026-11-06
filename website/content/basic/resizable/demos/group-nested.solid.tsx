import { createSignal } from 'solid-js';
import { ResizeGroup, ResizeHandler, ResizeItem, Toast } from '@fibrae/semi-ui-solid';

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
const itemStyle = {
    'background-color': 'var(--semi-grey-1)',
    border: 'var(--semi-color-border) 1px solid',
};

export default function ResizableDemo() {
    const [text, setText] = createSignal('Drag to resize');
    return (
        <div style={{ width: '1000px', height: '600px' }}>
            <ResizeGroup direction="vertical">
                <ResizeItem
                    style={{ 'background-color': 'var(--semi-grey-1)' }}
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
                    <div style={{ 'margin-inline-start': '20%' }}>header</div>
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
                            style={itemStyle}
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
                            <div style={{ 'margin-inline-start': '20%' }}>tab</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem
                            style={itemStyle}
                            defaultSize="75%"
                            onChange={() => {
                                setText('resizing');
                            }}
                        >
                            <div style={{ 'margin-inline-start': '20%' }}>{text()}</div>
                        </ResizeItem>
                    </ResizeGroup>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
