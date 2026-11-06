import { Button, Input, Popover, Space, type InputHandle, type TooltipRenderContentProps } from '@fibrae/semi-ui-react';

export default function PopoverDemo() {
    const renderContent = (contentProps: TooltipRenderContentProps<InputHandle>) => {
        return (
            <div style={{ padding: 12 }}>
                <Space>
                    <Button>first focusable element</Button>
                    <Input ref={contentProps.initialFocusRef} placeholder="focus here" />
                </Space>
            </div>
        );
    };

    return (
        <Popover content={renderContent} trigger="click">
            <Button>click me</Button>
        </Popover>
    );
}
