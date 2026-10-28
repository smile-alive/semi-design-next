import { Dropdown, type DropDownMenuItem } from '@fibrae/semi-ui-react';

interface MenuExampleProps {
    menu: DropDownMenuItem[];
}

export default function MenuExample({ menu }: MenuExampleProps) {
    return (
        <div style={{ height: 150 }}>
            <Dropdown visible trigger="custom" autoAdjustOverflow={false} position="bottomLeft" menu={menu} />
        </div>
    );
}
