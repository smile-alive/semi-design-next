import { createSignal } from 'solid-js';
import { ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-solid';

const itemStyle = {
    'background-color': 'var(--semi-grey-1)',
    border: 'var(--semi-color-border) 1px solid',
};
const borderStyle = { border: 'var(--semi-color-border) 1px solid' };

export default function ResizableDemo() {
    const [text, setText] = createSignal('Drag to resize');

    return (
        <div style={{ width: '1000px', height: '600px' }}>
            <ResizeGroup direction="vertical">
                <ResizeItem defaultSize="80%">
                    <ResizeGroup direction="horizontal">
                        <ResizeItem style={itemStyle} defaultSize="25%" min="10%" max="30%">
                            <div style={{ 'margin-inline-start': '20%' }}>{text() + ' min:10% max:30%'}</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem style={borderStyle} defaultSize="50%">
                            <div style={{ height: '100%' }}>
                                <ResizeGroup direction="vertical">
                                    <ResizeItem
                                        style={itemStyle}
                                        defaultSize="33%"
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
                                    <ResizeItem style={itemStyle} defaultSize="33%" min="10%" max="40%">
                                        <div style={{ 'margin-inline-start': '20%' }}>{text() + ' min:10% max:40%'}</div>
                                    </ResizeItem>
                                    <ResizeHandler />
                                    <ResizeItem style={itemStyle}>
                                        <div style={{ 'margin-inline-start': '20%' }}>{text()}</div>
                                    </ResizeItem>
                                </ResizeGroup>
                            </div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem style={itemStyle} defaultSize="1" max="30%">
                            <div style={{ 'margin-inline-start': '20%' }}>{text() + ' max:30%'}</div>
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
                        <ResizeItem style={itemStyle} defaultSize="50%">
                            <div style={{ 'margin-inline-start': '20%' }}>tab</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem style={itemStyle} defaultSize="50%">
                            <div style={{ 'margin-inline-start': '20%' }}>content</div>
                        </ResizeItem>
                    </ResizeGroup>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
