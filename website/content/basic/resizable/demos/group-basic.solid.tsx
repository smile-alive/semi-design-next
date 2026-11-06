import { createSignal } from 'solid-js';
import { ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-solid';

const itemStyle = {
    'background-color': 'var(--semi-grey-1)',
    border: 'var(--semi-color-border) 1px solid',
};

export default function ResizableDemo() {
    const [text, setText] = createSignal('Drag to resize');
    return (
        <div style={{ width: '1000px', height: '100px' }}>
            <ResizeGroup direction="horizontal">
                <ResizeItem
                    style={itemStyle}
                    defaultSize="400px"
                    min="10%"
                    onChange={() => {
                        setText('resizing');
                    }}
                    onResizeEnd={() => {
                        setText('Drag to resize');
                    }}
                >
                    <div style={{ 'margin-inline-start': '20%' }}>{text() + ' min:10%'}</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    style={itemStyle}
                    defaultSize="20%"
                    min="10%"
                    max="30%"
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <div style={{ 'margin-inline-start': '20%' }}>{text() + ' min:10% max:30%'}</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    style={itemStyle}
                    defaultSize="0.5"
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <div style={{ 'margin-inline-start': '20%' }}>{text()}</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    style={itemStyle}
                    defaultSize={1}
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <div style={{ 'margin-inline-start': '20%' }}>{text()}</div>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
