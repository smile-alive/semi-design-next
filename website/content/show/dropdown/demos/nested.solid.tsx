import { For } from 'solid-js';
import { IconToken } from '@fibrae/semi-icons-solid/lab';
import { Button, Dropdown, Toast } from '@fibrae/semi-ui-solid';

const nestedItems = [1, 2, 3];

// A JSX element can be inserted into one place only, so each submenu builds its own menu
const subMenu = () => (
    <Dropdown.Menu>
        <For each={nestedItems}>{(n) => <Dropdown.Item onClick={() => Toast.info({ content: `点击了 Nested Menu Item ${n}` })}>Nested Menu Item {n}</Dropdown.Item>}</For>
    </Dropdown.Menu>
);

export default function DropdownDemo() {
    return (
        <div style={{ margin: '100px' }}>
            <Dropdown
                render={
                    <Dropdown.Menu>
                        <Dropdown position="rightTop" render={subMenu()}>
                            {(getTriggerProps) => <Dropdown.Item {...getTriggerProps()}>Menu Item 1</Dropdown.Item>}
                        </Dropdown>
                        <Dropdown position="leftTop" render={subMenu()}>
                            {(getTriggerProps) => <Dropdown.Item {...getTriggerProps()}>Menu Item 2</Dropdown.Item>}
                        </Dropdown>
                        <Dropdown.Item>Menu Item 3</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                {(getTriggerProps) => (
                    <Button theme="outline" type="tertiary" icon={<IconToken />} {...getTriggerProps()}>
                        Hover Me
                    </Button>
                )}
            </Dropdown>
        </div>
    );
}
