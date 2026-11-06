import { useState } from 'react';
import { Resizable, Switch, Typography } from '@fibrae/semi-ui-react';

export default function ResizableDemo() {
    const [enabled, setEnabled] = useState(false);
    return (
        <div style={{ width: '500px', height: '60%' }}>
            <div style={{ display: 'flex', alignItems: 'center', margin: '8px' }}>
                <Switch aria-labelledby="resizable-enable-state" checked={enabled} onChange={setEnabled} />
                <Typography.Title id="resizable-enable-state" heading={6} style={{ margin: '8px' }}>
                    {enabled ? 'able' : 'disable'}
                </Typography.Title>
            </div>
            <Resizable
                style={{ backgroundColor: 'var(--semi-grey-1)' }}
                enable={{
                    left: enabled,
                }}
                defaultSize={{
                    width: 200,
                    height: 200,
                }}
            >
                <div style={{ marginInlineStart: '20%' }}>{'enable.left:' + enabled}</div>
            </Resizable>
        </div>
    );
}
