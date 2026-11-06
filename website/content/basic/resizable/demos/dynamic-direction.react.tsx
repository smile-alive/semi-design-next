import { useState } from 'react';
import { ResizeItem, ResizeHandler, ResizeGroup, Button } from '@fibrae/semi-ui-react';

const itemStyle = { backgroundColor: 'var(--semi-grey-1)' };
const contentStyle = { marginInlineStart: '20%', padding: '5px' };

export default function ResizableDemo() {
    const [text, setText] = useState('drag to resize');
    const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');

    const changeDirection = () => {
        setDirection(direction === 'horizontal' ? 'vertical' : 'horizontal');
    };
    return (
        <div style={{ width: '400px', height: '300px' }}>
            <Button onClick={changeDirection}>{direction}</Button>
            <ResizeGroup direction={direction}>
                <ResizeItem
                    onChange={() => {
                        setText('resizing');
                    }}
                    onResizeEnd={() => {
                        setText('drag to resize');
                    }}
                    defaultSize={5}
                >
                    <ResizeGroup direction="horizontal">
                        <ResizeItem
                            style={itemStyle}
                            onChange={() => {
                                setText('resizing');
                            }}
                            onResizeEnd={() => {
                                setText('drag to resize');
                            }}
                        >
                            <div style={contentStyle}>{text}</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem
                            style={itemStyle}
                            onChange={() => {
                                setText('resizing');
                            }}
                        >
                            <div style={contentStyle}>{text}</div>
                        </ResizeItem>
                    </ResizeGroup>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    style={itemStyle}
                    defaultSize={1.3}
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <div style={contentStyle}>{text}</div>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
