import { Dropdown, Tag } from '@fibrae/semi-ui-solid';

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
            <Dropdown position="bottom" render={menu()}>
                <Tag>Bottom</Tag>
            </Dropdown>
            <br />
            <br />
            <Dropdown position="bottomLeft" render={menu()}>
                <Tag>bottomLeft</Tag>
            </Dropdown>
            <br />
            <br />
            <Dropdown position="bottomRight" render={menu()}>
                <Tag>bottomRight</Tag>
            </Dropdown>
        </div>
    );
}
