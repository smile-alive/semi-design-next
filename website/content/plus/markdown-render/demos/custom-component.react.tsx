import type { MouseEventHandler, ReactNode } from 'react';
import { Button, MarkdownRender, type MarkdownRenderComponents } from '@fibrae/semi-ui-react';

interface MyButtonProps {
    children?: ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
}

const components: MarkdownRenderComponents = {
    ...MarkdownRender.defaultComponents,
    MyButton: ({ children, onClick }: MyButtonProps) => (
        <Button type="primary" onClick={onClick} style={{ marginBottom: '12px' }}>
            {' '}
            {children}{' '}
        </Button>
    ),
};

const raw = `
#### 下面是一个渲染在 Markdown 中的按钮
<MyButton onClick={()=>alert("点击了 MyButton")}>MyButton 点我</MyButton>

直接在 Markdown 中书写 JSX 即可
        `;

export default function MarkdownRenderDemo() {
    return <MarkdownRender raw={raw} components={components} />;
}
