import { useMemo } from 'react';
import { IconToken } from '@fibrae/semi-icons-react/lab';
import { Dropdown, Button, Toast } from '@fibrae/semi-ui-react';

export default function DropdownDemo() {
    // Enter and Space trigger a submenu item's onClick too
    const subDropdown = useMemo(
        () => (
            <Dropdown.Menu>
                {[1, 2, 3].map((n) => (
                    <Dropdown.Item key={n} onClick={() => Toast.info({ content: `点击了 Nested Menu Item ${n}` })}>
                        Nested Menu Item {n}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        ),
        []
    );

    return (
        <div style={{ margin: 100 }}>
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <Dropdown position="rightTop" render={subDropdown}>
                            <Dropdown.Item>Menu Item 1</Dropdown.Item>
                        </Dropdown>
                        <Dropdown position="leftTop" render={subDropdown}>
                            <Dropdown.Item>Menu Item 2</Dropdown.Item>
                        </Dropdown>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                <Button theme="outline" type="tertiary" icon={<IconToken />}>
                    Hover Me
                </Button>
            </Dropdown>
        </div>
    );
}
