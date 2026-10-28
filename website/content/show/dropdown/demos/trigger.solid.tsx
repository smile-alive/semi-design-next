import { Button, Dropdown, Tag } from '@fibrae/semi-ui-solid';

const menu = () => (
    <Dropdown.Menu>
        <Dropdown.Item>Menu Item 1</Dropdown.Item>
        <Dropdown.Item>Menu Item 2</Dropdown.Item>
        <Dropdown.Item>Menu Item 3</Dropdown.Item>
    </Dropdown.Menu>
);

export default function DropdownDemo() {
    return (
        <div>
            <Dropdown trigger="hover" position="bottomLeft" render={menu()}>
                <Tag>Hover me</Tag>
            </Dropdown>
            <br />
            <br />
            <Dropdown
                trigger="focus"
                position="bottomLeft"
                render={
                    <Dropdown.Menu tabIndex={-1}>
                        <Dropdown.Item>Menu Item 1</Dropdown.Item>
                        <Dropdown.Item>Menu Item 2</Dropdown.Item>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                <div
                    style={{
                        border: '1px solid var(--semi-color-border)',
                        'border-radius': '4px',
                        height: '36px',
                        width: '220px',
                    }}
                >
                    Please use Tab to focus this div
                </div>
            </Dropdown>
            <br />
            <br />
            <Dropdown trigger="click" position="bottomLeft" render={menu()}>
                {(getTriggerProps) => <Button {...getTriggerProps()}>Click me</Button>}
            </Dropdown>
            <br />
            <br />
            <Dropdown trigger="contextMenu" position="bottomRight" render={menu()}>
                {(getTriggerProps) => (
                    <Button theme="solid" type="secondary" style={{ 'margin-bottom': '20px' }} {...getTriggerProps()}>
                        Right click (ContextMenu)
                    </Button>
                )}
            </Dropdown>
        </div>
    );
}
