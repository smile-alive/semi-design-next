import type { MouseEventHandler, ReactNode } from 'react';
import { Button, MarkdownRender, type MarkdownRenderComponents } from '@fibrae/semi-ui-react';

interface MyButtonProps {
    children?: ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
}

export default function MarkdownRenderDemo() {
    const components: MarkdownRenderComponents = {};

    components['MyButton'] = ({ children, onClick }: MyButtonProps) => {
        return (
            <Button type="primary" onClick={onClick} style={{ marginBottom: '12px' }}>
                {' '}
                {children}{' '}
            </Button>
        );
    };

    return (
        <MarkdownRender
            raw={`
#### 下面是一个渲染在 Markdown 中的按钮
<MyButton onClick={()=>alert("点击了 MyButton")}>MyButton 点我</MyButton>

直接在 Markdown 中书写 JSX 即可
        `}
            components={{ ...MarkdownRender.defaultComponents, ...components }}
        />
    );
}
