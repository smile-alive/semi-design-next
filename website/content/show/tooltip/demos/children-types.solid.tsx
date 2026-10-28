import { type ComponentProps } from 'solid-js';
import { Space, Tooltip } from '@fibrae/semi-ui-solid';

const style = { border: '2px solid var(--semi-color-border)', 'padding-left': '4px', 'padding-right': '4px', 'border-radius': '4px' };

// A component only works as a trigger when the props from getTriggerProps (including ref) reach its DOM node
function Child(props: ComponentProps<'span'>) {
    return (
        <span {...props} style={style}>
            Functional Component
        </span>
    );
}

export default function TooltipDemo() {
    return (
        <Space>
            <Tooltip content="semi design">{(trigger) => <Child {...trigger()} />}</Tooltip>
            <Tooltip content="semi design">
                <span style={style}>DOM</span>
            </Tooltip>
            <Tooltip content="semi design">Text</Tooltip>
        </Space>
    );
}
