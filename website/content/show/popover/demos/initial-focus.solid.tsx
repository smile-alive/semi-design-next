import { Button, Input, Popover, Space, type TooltipRenderContentProps } from '@fibrae/semi-ui-solid';

export default function PopoverDemo() {
    const renderContent = (props: TooltipRenderContentProps) => (
        <div style={{ padding: '12px' }}>
            <Space>
                <Button>first focusable element</Button>
                <Input ref={props.initialFocusRef} placeholder="focus here" />
            </Space>
        </div>
    );

    return (
        <Popover content={renderContent} trigger="click">
            {(trigger) => <Button {...trigger()}>click me</Button>}
        </Popover>
    );
}
