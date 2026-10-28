import { IconToken } from '@fibrae/semi-icons-solid/lab';
import { Button, Dropdown, Toast } from '@fibrae/semi-ui-solid';

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
            {(getTriggerProps) => (
                <Button theme="outline" type="tertiary" icon={<IconToken />} {...getTriggerProps()}>
                    Click Me
                </Button>
            )}
        </Dropdown>
    );
}
