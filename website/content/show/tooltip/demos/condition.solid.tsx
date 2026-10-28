import { createSignal } from 'solid-js';
import { Button, Space, Switch, Tooltip, Typography } from '@fibrae/semi-ui-solid';

export default function TooltipDemo() {
    const [enabled, setEnabled] = createSignal(true);
    const content = () => `condition is ${enabled() ? 'true' : 'false'}`;

    return (
        <Space align="center">
            <Typography.Text id="tooltip-condition-label">condition</Typography.Text>
            <Switch aria-labelledby="tooltip-condition-label" checked={enabled()} onChange={setEnabled} />
            <Tooltip content={content()} trigger="hover" condition={enabled()}>
                {(trigger) => <Button {...trigger()}>Hover me</Button>}
            </Tooltip>
            <Tooltip content={content()} trigger="click" condition={enabled()}>
                {(trigger) => <Button {...trigger()}>Click me</Button>}
            </Tooltip>
        </Space>
    );
}
