import { createSignal } from 'solid-js';
import { ResizeGroup, ResizeHandler, ResizeItem, Toast } from '@fibrae/semi-ui-solid';

const boxStyle = {
    'background-color': 'var(--semi-grey-1)',
    border: 'var(--semi-color-border) 1px solid',
};

const textStyle = {
    'margin-left': '20%',
};

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
                        Toast.info(startToast);
                    }}
                    onResizeEnd={() => {
                        Toast.info(endToast);
                        setText('Drag to resize');
                    }}
                >
                    <div style={textStyle}>header</div>
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
                            style={boxStyle}
                            defaultSize="25%"
                            onChange={() => {
                                setText('resizing');
                            }}
                            onResizeStart={() => {
                                Toast.info(startToast);
                            }}
                            onResizeEnd={() => {
                                Toast.info(endToast);
                                setText('Drag to resize');
                            }}
                        >
                            <div style={textStyle}>tab</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem
                            style={boxStyle}
                            defaultSize="75%"
                            onChange={() => {
                                setText('resizing');
                            }}
                        >
                            <div style={textStyle}>{text()}</div>
                        </ResizeItem>
                    </ResizeGroup>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
