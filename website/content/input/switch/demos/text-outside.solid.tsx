import { createSignal } from 'solid-js';
import { Switch, Typography } from '@fibrae/semi-ui-solid';

export default function SwitchDemo() {
    const [open, setOpen] = createSignal<boolean>();

    return (
        <div style={{ display: 'flex', 'align-items': 'center' }}>
            <Typography.Title heading={6} style={{ margin: '8px' }}>
                {open() ? '已开启' : '已关闭'}
            </Typography.Title>
            <Switch checked={open()} onChange={(value) => setOpen(value)} aria-label="a switch for demo" />
        </div>
    );
}
