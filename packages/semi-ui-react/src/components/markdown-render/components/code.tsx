import type { PropsWithChildren } from 'react';
import { cssClasses } from '@fibrae/semi-foundation/components/markdown-render/constants';
import MarkdownRenderFoundation from '@fibrae/semi-foundation/components/markdown-render/foundation';
import CodeHighlight from '../../code-highlight';

function code(props: PropsWithChildren<{ className?: string }>) {
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

// pre drops its wrapper around a block from a component with this mark; a replacement that wraps this code sets it too
export default Object.assign(code, { elementType: 'MarkdownRender.Code' });
