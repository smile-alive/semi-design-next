import { useState } from 'react';
import { Resizable, Button, type ResizableProps } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    const [size, setSize] = useState<NonNullable<ResizableProps['size']>>({ width: 200, height: 100 });
    const onButtonClick = () => {
        let realSize = { width: Number(size.width) + 10, height: Number(size.height) + 10 };
        setSize(realSize);
    };
    const onChange: ResizableProps['onChange'] = (s) => {
        setSize(s);
    };

    return (
        <div style={{ width: '500px', height: '60%' }}>
            <Button onClick={onButtonClick}>set += 10</Button>
            <Resizable style={{ backgroundColor: 'var(--semi-grey-1)', marginTop: '10px' }} size={size} onChange={onChange}>
                <div style={{ marginLeft: '20%' }}>受控</div>
            </Resizable>
        </div>
    );
}
