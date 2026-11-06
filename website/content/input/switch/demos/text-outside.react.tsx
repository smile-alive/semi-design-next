import { useState } from 'react';
import { Switch, Typography } from '@fibrae/semi-ui-react';

export default function SwitchDemo() {
    const [open, setOpen] = useState<boolean>();
    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography.Title heading={6} style={{ margin: 8 }}>
                {open ? '已开启' : '已关闭'}
            </Typography.Title>
            <Switch checked={open} onChange={setOpen} aria-label="a switch for demo" />
        </div>
    );
}
