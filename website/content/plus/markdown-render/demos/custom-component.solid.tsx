import type { JSX } from 'solid-js';
import { Button, MarkdownRender, type MarkdownRenderComponents } from '@fibrae/semi-ui-solid';

interface MyButtonProps {
    children?: JSX.Element;
    onClick?: (event: MouseEvent) => void;
}

const components: MarkdownRenderComponents = {
    MyButton: (props: MyButtonProps) => (
        <Button type="primary" onClick={props.onClick} style={{ 'margin-bottom': '12px' }}>
            {' '}
            {props.children}{' '}
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
