import { type PropsWithChildren, Children, isValidElement } from 'react';
import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
import code from './code';

// CodeHighlight's div and pre are invalid inside a pre, so the wrapper of a highlighted block goes; only the Semi code
// component is detected, and code it does not highlight (split into elements by a plugin) keeps the pre
export default function pre(props: PropsWithChildren<object>) {
    const nodes = Children.toArray(props.children).filter((child) => typeof child !== 'string' || child.trim() !== '');
    const [only] = nodes;
    if (nodes.length === 1 && isValidElement<PropsWithChildren<{ className?: string }>>(only) && only.type === code && MarkdownRenderFoundation.getCodeLanguage(only.props.className) && typeof only.props.children === 'string') {
        return only;
    }
    return <pre {...props} />;
}
