import { type PropsWithChildren, Children, isValidElement } from 'react';
import MarkdownRenderFoundation from '@fibrae/semi-foundation/components/markdown-render/foundation';
import elementTypeOf from '../../../utils/element-type';

// CodeHighlight's div and pre are invalid inside a pre, so the wrapper of a highlighted block goes; only a code component
// marked 'MarkdownRender.Code' is detected, and code it does not highlight (split into elements by a plugin) keeps the pre
export default function pre(props: PropsWithChildren<object>) {
    const nodes = Children.toArray(props.children).filter((child) => typeof child !== 'string' || child.trim() !== '');
    const [only] = nodes;
    if (nodes.length === 1 && isValidElement<PropsWithChildren<{ className?: string }>>(only) && elementTypeOf(only) === 'MarkdownRender.Code' && MarkdownRenderFoundation.getCodeLanguage(only.props.className) && typeof only.props.children === 'string') {
        return only;
    }
    return <pre {...props} />;
}
