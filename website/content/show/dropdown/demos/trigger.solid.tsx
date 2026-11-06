import { Button, Dropdown, Tag } from '@fibrae/semi-ui-solid';

export default function DropdownDemo() {
    return (
        <div>
            <Dropdown
                trigger="hover"
                position="bottomLeft"
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>Menu Item 1</Dropdown.Item>
                        <Dropdown.Item>Menu Item 2</Dropdown.Item>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
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
            <Dropdown
                trigger="click"
                position="bottomLeft"
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>Menu Item 1</Dropdown.Item>
                        <Dropdown.Item>Menu Item 2</Dropdown.Item>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                {(getTriggerProps) => <Button {...getTriggerProps()}>Click me</Button>}
            </Dropdown>
            <br />
            <br />
            <Dropdown
                trigger="contextMenu"
                position="bottomRight"
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>Menu Item 1</Dropdown.Item>
                        <Dropdown.Item>Menu Item 2</Dropdown.Item>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                {(getTriggerProps) => (
                    <Button theme="solid" type="secondary" style={{ 'margin-block-end': '20px' }} {...getTriggerProps()}>
                        Right click (ContextMenu)
                    </Button>
                )}
            </Dropdown>
        </div>
    );
}
