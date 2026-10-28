import { createSignal } from 'solid-js';
import { Resizable, Switch, Typography } from '@fibrae/semi-ui-solid';

export default function ResizableDemo() {
    const [b, setB] = createSignal(false);
    return (
        <div style={{ width: '500px', height: '60%' }}>
            <div style={{ display: 'flex', 'align-items': 'center', margin: '8px' }}>
                <Switch aria-labelledby="resizable-enable-state" checked={b()} onChange={(checked) => setB(checked)} />
                <Typography.Title id="resizable-enable-state" heading={6} style={{ margin: '8px' }}>
                    {b() ? 'able' : 'disable'}
                </Typography.Title>
            </div>
            <Resizable
                style={{ 'background-color': 'var(--semi-grey-1)' }}
                enable={{
                    left: b(),
                }}
                defaultSize={{
                    width: 200,
                    height: 200,
                }}
            >
                <div style={{ 'margin-left': '20%' }}>{'enable.left:' + b()}</div>
            </Resizable>
        </div>
    );
}
