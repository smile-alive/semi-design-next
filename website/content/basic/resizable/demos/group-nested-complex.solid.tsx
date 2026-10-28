import { createSignal } from 'solid-js';
import { ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-solid';

const boxStyle = {
    'background-color': 'var(--semi-grey-1)',
    border: 'var(--semi-color-border) 1px solid',
};

const frameStyle = {
    border: 'var(--semi-color-border) 1px solid',
};

const textStyle = {
    'margin-left': '20%',
};

export default function ResizableDemo() {
    const [text, setText] = createSignal('Drag to resize');

    return (
        <div style={{ width: '1000px', height: '600px' }}>
            <ResizeGroup direction="vertical">
                <ResizeItem defaultSize="80%">
                    <ResizeGroup direction="horizontal">
                        <ResizeItem style={boxStyle} defaultSize="25%" min="10%" max="30%">
                            <div style={textStyle}>{text() + ' min:10% max:30%'}</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem style={frameStyle} defaultSize="50%">
                            <div style={{ height: '100%' }}>
                                <ResizeGroup direction="vertical">
                                    <ResizeItem
                                        style={boxStyle}
                                        defaultSize="33%"
                                        min="10%"
                                        onChange={() => {
                                            setText('resizing');
                                        }}
                                        onResizeEnd={() => {
                                            setText('Drag to resize');
                                        }}
                                    >
                                        <div style={textStyle}>{text() + ' min:10%'}</div>
                                    </ResizeItem>
                                    <ResizeHandler />
                                    <ResizeItem style={boxStyle} defaultSize="33%" min="10%" max="40%">
                                        <div style={textStyle}>{text() + ' min:10% max:40%'}</div>
                                    </ResizeItem>
                                    <ResizeHandler />
                                    <ResizeItem style={boxStyle}>
                                        <div style={textStyle}>{text()}</div>
                                    </ResizeItem>
                                </ResizeGroup>
                            </div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem style={boxStyle} defaultSize="1" max="30%">
                            <div style={textStyle}>{text() + ' max:30%'}</div>
                        </ResizeItem>
                    </ResizeGroup>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    defaultSize="20%"
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <ResizeGroup direction="horizontal">
                        <ResizeItem style={boxStyle} defaultSize="50%">
                            <div style={textStyle}>tab</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem style={boxStyle} defaultSize="50%">
                            <div style={textStyle}>content</div>
                        </ResizeItem>
                    </ResizeGroup>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
