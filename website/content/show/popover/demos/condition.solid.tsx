import { createSignal } from 'solid-js';
import { Popover, Button, Switch, Space, Typography } from '@fibrae/semi-ui-solid';

export default function PopoverDemo() {
    const [enabled, setEnabled] = createSignal(true);
    const content = () => `condition is ${enabled() ? 'true' : 'false'}`;

    return (
        <Space align="center">
            <Typography.Text id="popover-condition-label">condition</Typography.Text>
            <Switch aria-labelledby="popover-condition-label" checked={enabled()} onChange={(v) => setEnabled(v)} />
            <Popover content={content} condition={enabled()}>
                {(trigger) => <Button {...trigger()}>Hover me</Button>}
            </Popover>
            <Popover content={content} trigger="click" condition={enabled()}>
                {(trigger) => <Button {...trigger()}>Click me</Button>}
            </Popover>
        </Space>
    );
}
