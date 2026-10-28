import { useState } from 'react';
import { ResizeItem, ResizeHandler, ResizeGroup, Button } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    const [text, setText] = useState('drag to resize');
    const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');

    const changeDirection = () => {
        if (direction === 'horizontal') {
            setDirection('vertical');
        } else {
            setDirection('horizontal');
        }
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
                            style={{ backgroundColor: 'var(--semi-grey-1)' }}
                            onChange={() => {
                                setText('resizing');
                            }}
                            onResizeEnd={() => {
                                setText('drag to resize');
                            }}
                        >
                            <div style={{ marginLeft: '20%', padding: '5px' }}>{text}</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem
                            style={{ backgroundColor: 'var(--semi-grey-1)' }}
                            onChange={() => {
                                setText('resizing');
                            }}
                        >
                            <div style={{ marginLeft: '20%', padding: '5px' }}>{text}</div>
                        </ResizeItem>
                    </ResizeGroup>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    style={{ backgroundColor: 'var(--semi-grey-1)' }}
                    defaultSize={1.3}
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <div style={{ marginLeft: '20%', padding: '5px' }}>{text}</div>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
