import React from 'react';
import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-react';
import { Popover, Space, Empty } from '@fibrae/semi-ui-react';

const style = { border: '2px solid var(--semi-color-border)', paddingLeft: 4, paddingRight: 4, borderRadius: 4 };

// Pass props to the underlying DOM and bind the ref (a plain prop in React 19)
function FCChildren({ ref, ...props }: React.ComponentProps<'span'>) {
    return (
        <span {...props} ref={ref} style={style}>
            Functional Component
        </span>
    );
}

class MyComponent extends React.Component {
    render() {
        return (
            <span {...this.props} style={style}>
                ClassComponent
            </span>
        );
    }
}

const content = (
    <Empty
        title="先进的设计 / 研发协作方式"
        image={<IllustrationSuccess style={{ width: 150, height: 150 }} />}
        darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />}
        description="使用 Semi D2C 快速还原 Figma 设计稿，一键转代码"
        style={{ width: 400, margin: '0 auto', display: 'flex', padding: 20 }}
    />
);

export default function PopoverDemo() {
    return (
        <Space>
            <Popover content={content}>
                <FCChildren />
            </Popover>
            <Popover content={content}>
                <MyComponent />
            </Popover>
            <Popover content={content}>
                <span style={style}>DOM</span>
            </Popover>
        </Space>
    );
}
