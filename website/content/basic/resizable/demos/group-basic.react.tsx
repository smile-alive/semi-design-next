import { useState } from 'react';
import { ResizeItem, ResizeHandler, ResizeGroup } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    const [text, setText] = useState('Drag to resize');
    return (
        <div style={{ width: '1000px', height: '100px' }}>
            <ResizeGroup direction="horizontal">
                <ResizeItem
                    style={{
                        backgroundColor: 'var(--semi-grey-1)',
                        border: 'var(--semi-color-border) 1px solid',
                    }}
                    defaultSize="400px"
                    min="10%"
                    onChange={() => {
                        setText('resizing');
                    }}
                    onResizeEnd={() => {
                        setText('Drag to resize');
                    }}
                >
                    <div style={{ marginLeft: '20%' }}>{text + ' min:10%'}</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    style={{
                        backgroundColor: 'var(--semi-grey-1)',
                        border: 'var(--semi-color-border) 1px solid',
                    }}
                    defaultSize="20%"
                    min="10%"
                    max="30%"
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <div style={{ marginLeft: '20%' }}>{text + ' min:10% max:30%'}</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    style={{
                        backgroundColor: 'var(--semi-grey-1)',
                        border: 'var(--semi-color-border) 1px solid',
                    }}
                    defaultSize="0.5"
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <div style={{ marginLeft: '20%' }}>{text}</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    style={{
                        backgroundColor: 'var(--semi-grey-1)',
                        border: 'var(--semi-color-border) 1px solid',
                    }}
                    defaultSize={1}
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <div style={{ marginLeft: '20%' }}>{text}</div>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
