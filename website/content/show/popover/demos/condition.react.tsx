import { useMemo, useState } from 'react';
import { Popover, Button, Switch, Space, Typography } from '@fibrae/semi-ui-react';

export default function PopoverDemo() {
    const [enabled, setEnabled] = useState(true);
    const content = useMemo(() => `condition is ${enabled ? 'true' : 'false'}`, [enabled]);

    return (
        <Space align="center">
            <Typography.Text id="popover-condition-label">condition</Typography.Text>
            <Switch aria-labelledby="popover-condition-label" checked={enabled} onChange={(v) => setEnabled(v)} />
            <Popover content={content} condition={enabled}>
                <Button>Hover me</Button>
            </Popover>
            <Popover content={content} trigger="click" condition={enabled}>
                <Button>Click me</Button>
            </Popover>
        </Space>
    );
}
