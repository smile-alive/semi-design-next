import type { ReactNode } from 'react';
import { MarkdownRender, Typography, type MarkdownRenderComponents } from '@fibrae/semi-ui-react';

export default function MarkdownRenderDemo() {
    const components: MarkdownRenderComponents = {};

    components['h2'] = ({ children }: { children?: ReactNode }) => (
        <Typography.Title heading={2} style={{ color: 'var(--semi-color-primary)' }}>
            {children}
        </Typography.Title>
    );

    return <MarkdownRender raw="## 从 Semi Design 到 Any Design  快速定义你的设计系统，并应用在设计稿和代码中" components={components} />;
}
