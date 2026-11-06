import { useState } from 'react';
import { Resizable, Button, type ResizableProps } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    const [size, setSize] = useState<NonNullable<ResizableProps['size']>>({ width: 200, height: 100 });
    const onButtonClick = () => {
        setSize({ width: Number(size.width) + 10, height: Number(size.height) + 10 });
    };

    return (
        <div style={{ width: '500px', height: '60%' }}>
            <Button onClick={onButtonClick}>set += 10</Button>
            <Resizable style={{ backgroundColor: 'var(--semi-grey-1)', marginBlockStart: '10px' }} size={size} onChange={(next) => setSize(next)}>
                <div style={{ marginInlineStart: '20%' }}>受控</div>
            </Resizable>
        </div>
    );
}
