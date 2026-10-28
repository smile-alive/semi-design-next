import { useMemo, useState } from 'react';
import { Tooltip, Button, Switch, Space, Typography } from '@fibrae/semi-ui-react';

export default function TooltipDemo() {
    const [enabled, setEnabled] = useState(true);
    const content = useMemo(() => `condition is ${enabled ? 'true' : 'false'}`, [enabled]);

    return (
        <Space align="center">
            <Typography.Text id="tooltip-condition-label">condition</Typography.Text>
            <Switch aria-labelledby="tooltip-condition-label" checked={enabled} onChange={(v) => setEnabled(v)} />
            <Tooltip content={content} trigger="hover" condition={enabled}>
                <Button>Hover me</Button>
            </Tooltip>
            <Tooltip content={content} trigger="click" condition={enabled}>
                <Button>Click me</Button>
            </Tooltip>
        </Space>
    );
}
