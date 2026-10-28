import { useState } from 'react';
import { Resizable, Switch, Typography } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    const [b, setB] = useState(false);
    const { Title } = Typography;
    return (
        <div style={{ width: '500px', height: '60%' }}>
            <div style={{ display: 'flex', alignItems: 'center', margin: 8 }}>
                <Switch aria-labelledby="resizable-enable-state" checked={b} onChange={setB} />
                <Title id="resizable-enable-state" heading={6} style={{ margin: 8 }}>
                    {b ? 'able' : 'disable'}
                </Title>
            </div>
            <Resizable
                style={{ backgroundColor: 'var(--semi-grey-1)' }}
                enable={{
                    left: b,
                }}
                defaultSize={{
                    width: 200,
                    height: 200,
                }}
            >
                <div style={{ marginLeft: '20%' }}>{'enable.left:' + b}</div>
            </Resizable>
        </div>
    );
}
