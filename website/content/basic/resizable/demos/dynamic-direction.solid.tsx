import { createSignal } from 'solid-js';
import { Button, ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-solid';

const boxStyle = {
    'background-color': 'var(--semi-grey-1)',
};

const textStyle = {
    'margin-left': '20%',
    padding: '5px',
};

export default function ResizableDemo() {
    const [text, setText] = createSignal('drag to resize');
    const [direction, setDirection] = createSignal<'horizontal' | 'vertical'>('horizontal');

    const changeDirection = () => {
        setDirection(direction() === 'horizontal' ? 'vertical' : 'horizontal');
    };

    return (
        <div style={{ width: '400px', height: '300px' }}>
            <Button onClick={changeDirection}>{direction()}</Button>
            <ResizeGroup direction={direction()}>
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
                            style={boxStyle}
                            onChange={() => {
                                setText('resizing');
                            }}
                            onResizeEnd={() => {
                                setText('drag to resize');
                            }}
                        >
                            <div style={textStyle}>{text()}</div>
                        </ResizeItem>
                        <ResizeHandler />
                        <ResizeItem
                            style={boxStyle}
                            onChange={() => {
                                setText('resizing');
                            }}
                        >
                            <div style={textStyle}>{text()}</div>
                        </ResizeItem>
                    </ResizeGroup>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem
                    style={boxStyle}
                    defaultSize={1.3}
                    onChange={() => {
                        setText('resizing');
                    }}
                >
                    <div style={textStyle}>{text()}</div>
                </ResizeItem>
            </ResizeGroup>
        </div>
    );
}
