import { type MarkdownChild, isNode } from './runtime.js';

/** The source of a code element from its children, untrimmed: a fenced block ends with its newline, as in React. */
export default function codeText(children: MarkdownChild): string {
    if (Array.isArray(children)) return children.map(codeText).join('');
    if (isNode(children)) {
        // rehype plugins such as highlighters split the source into nested elements
        return typeof children.type === 'string' ? codeText(children.props.children as MarkdownChild) : '';
    }
    return typeof children === 'string' || typeof children === 'number' ? String(children) : '';
}
