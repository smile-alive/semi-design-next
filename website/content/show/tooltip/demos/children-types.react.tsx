import React from 'react';
import { Tooltip, Space } from '@fibrae/semi-ui-react';

const style = { border: '2px solid var(--semi-color-border)', paddingLeft: 4, paddingRight: 4, borderRadius: 4 };

// Pass props to the underlying DOM and bind the ref (a plain prop in React 19)
function FCChildren({ ref, ...props }: React.ComponentProps<'span'>) {
    return (
        <span {...props} ref={ref} style={style}>
            Functional Component
        </span>
    );
}

// React 19 cannot reach a class component's DOM node, so wrap it in a real DOM node
class MyComponent extends React.Component {
    render() {
        return (
            <span {...this.props} style={style}>
                ClassComponent
            </span>
        );
    }
}

export default function TooltipDemo() {
    return (
        <Space>
            <Tooltip content="semi design">
                <FCChildren />
            </Tooltip>
            <Tooltip content="semi design">
                <span>
                    <MyComponent />
                </span>
            </Tooltip>
            <Tooltip content="semi design">
                <span style={style}>DOM</span>
            </Tooltip>
        </Space>
    );
}
