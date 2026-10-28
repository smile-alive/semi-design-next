import type { JSX } from 'solid-js';
import { MarkdownRender, Typography, type MarkdownRenderComponents } from '@fibrae/semi-ui-solid';

const components: MarkdownRenderComponents = {
    h2: (props: { children?: JSX.Element }) => (
        <Typography.Title heading={2} style={{ color: 'var(--semi-color-primary)' }}>
            {props.children}
        </Typography.Title>
    ),
};

export default function MarkdownRenderDemo() {
    return <MarkdownRender raw="## 从 Semi Design 到 Any Design  快速定义你的设计系统，并应用在设计稿和代码中" components={components} />;
}
