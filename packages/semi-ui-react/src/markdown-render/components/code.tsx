import type { PropsWithChildren } from 'react';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
import CodeHighlight from '../../code-highlight';

export default function code(props: PropsWithChildren<{ className?: string }>) {
    const language = MarkdownRenderFoundation.getCodeLanguage(props.className);
    // a rehype plugin may split the text into elements, which have no source text to highlight
    if (language && typeof props.children === 'string') {
        return <CodeHighlight code={props.children} language={language} lineNumber />;
    } else if (language) {
        return <code className={props.className}>{props.children}</code>;
    } else {
        return <code className={`${cssClasses.PREFIX}-simple-code`}>{props.children}</code>;
    }
}
