import { createSignal } from 'solid-js';
import { Button, Resizable, type ResizableProps } from '@fibrae/semi-ui-solid';

export default function ResizableDemo() {
    const [size, setSize] = createSignal<NonNullable<ResizableProps['size']>>({ width: 200, height: 100 });
    const onButtonClick = () => {
        const current = size();
        setSize({ width: Number(current.width) + 10, height: Number(current.height) + 10 });
    };

    return (
        <div style={{ width: '500px', height: '60%' }}>
            <Button onClick={onButtonClick}>set += 10</Button>
            <Resizable style={{ 'background-color': 'var(--semi-grey-1)', 'margin-block-start': '10px' }} size={size()} onChange={(next) => setSize(next)}>
                <div style={{ 'margin-inline-start': '20%' }}>受控</div>
            </Resizable>
        </div>
    );
}
