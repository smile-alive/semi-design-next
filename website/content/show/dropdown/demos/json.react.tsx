import { IconToken } from '@fibrae/semi-icons-react/lab';
import { Dropdown, Button, type DropDownMenuItem } from '@fibrae/semi-ui-react';

export default function DropdownDemo() {
    const menu: DropDownMenuItem[] = [
        { node: 'title', name: '分组1' },
        { node: 'item', name: 'primary1', type: 'primary', onClick: () => console.log('click primary') },
        { node: 'item', name: 'secondary', type: 'secondary' },
        { node: 'divider' },
        { node: 'title', name: '分组2' },
        { node: 'item', name: 'tertiary', type: 'tertiary' },
        { node: 'item', name: 'warning', type: 'warning', active: true },
        { node: 'item', name: 'danger', type: 'danger' },
    ];
    return (
        <Dropdown trigger="click" showTick position="bottomLeft" menu={menu}>
            <Button theme="outline" type="tertiary" icon={<IconToken />}>
                Click Me
            </Button>
        </Dropdown>
    );
}
