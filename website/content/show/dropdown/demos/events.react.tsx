import { IconToken } from '@fibrae/semi-icons-react/lab';
import { Dropdown, Button, Toast } from '@fibrae/semi-ui-react';

export default function DropdownDemo() {
    return (
        <Dropdown
            trigger="click"
            position="bottomLeft"
            render={
                <Dropdown.Menu>
                    <Dropdown.Item onClick={() => Toast.info({ content: 'You clicked me!' })}>1: click me!</Dropdown.Item>
                    <Dropdown.Item onMouseEnter={() => Toast.info({ content: 'Nice to meet you!' })}>2: mouse enter</Dropdown.Item>
                    <Dropdown.Item onMouseLeave={() => Toast.info({ content: 'See ya!' })}>3: mouse leave</Dropdown.Item>
                    <Dropdown.Item onContextMenu={() => Toast.info({ content: 'Right clicked!' })}>4: right click</Dropdown.Item>
                </Dropdown.Menu>
            }
        >
            <Button theme="outline" type="tertiary" icon={<IconToken />}>
                Click Me
            </Button>
        </Dropdown>
    );
}
