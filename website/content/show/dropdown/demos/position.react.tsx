import { Dropdown, Tag } from '@fibrae/semi-ui-react';

export default function DropdownDemo() {
    return (
        <div>
            <Dropdown
                position="bottom"
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>Menu Item 1</Dropdown.Item>
                        <Dropdown.Item>Menu Item 2</Dropdown.Item>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                <Tag>Bottom</Tag>
            </Dropdown>
            <br />
            <br />
            <Dropdown
                position="bottomLeft"
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>Menu Item 1</Dropdown.Item>
                        <Dropdown.Item>Menu Item 2</Dropdown.Item>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                <Tag>bottomLeft</Tag>
            </Dropdown>
            <br />
            <br />
            <Dropdown
                position="bottomRight"
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>Menu Item 1</Dropdown.Item>
                        <Dropdown.Item>Menu Item 2</Dropdown.Item>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                <Tag>bottomRight</Tag>
            </Dropdown>
        </div>
    );
}
