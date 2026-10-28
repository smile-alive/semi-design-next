import { IconBox, IconSetting, IconForward, IconRefresh, IconSearch, IconAlertCircle } from '@fibrae/semi-icons-react';
import { IconToken } from '@fibrae/semi-icons-react/lab';
import { Dropdown, Button, HotKeys } from '@fibrae/semi-ui-react';

export default function DropdownDemo() {
    return (
        <Dropdown
            position="bottomLeft"
            render={
                <Dropdown.Menu>
                    <Dropdown.Title>分组1</Dropdown.Title>
                    <Dropdown.Item icon={<IconBox />}>
                        Menu Item 1
                        <HotKeys style={{ marginLeft: 20 }} hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.B]} content={['Ctrl', 'B']} />
                    </Dropdown.Item>
                    <Dropdown.Item icon={<IconSetting />}>
                        Menu Item 2
                        <HotKeys style={{ marginLeft: 20 }} hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.V]} content={['Ctrl', 'V']} />
                    </Dropdown.Item>
                    <Dropdown.Item disabled icon={<IconForward />}>
                        Menu Item 3
                        <HotKeys style={{ marginLeft: 20 }} hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.F3]} content={['Ctrl', 'F3']} />
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Title>分组2</Dropdown.Title>
                    <Dropdown.Item type="tertiary" icon={<IconRefresh />}>
                        tertiary
                    </Dropdown.Item>
                    <Dropdown.Item type="warning" icon={<IconSearch />}>
                        warning
                    </Dropdown.Item>
                    <Dropdown.Item type="danger" icon={<IconAlertCircle />}>
                        danger
                    </Dropdown.Item>
                </Dropdown.Menu>
            }
        >
            <Button theme="outline" type="tertiary" icon={<IconToken />}>
                Hover Me
            </Button>
        </Dropdown>
    );
}
