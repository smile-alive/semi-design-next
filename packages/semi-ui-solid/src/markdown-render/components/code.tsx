import { children, type JSX, Match, Switch } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import MarkdownRenderFoundation from '@fibrae/semi-foundation/markdown-render/foundation';
import CodeHighlight from '../../code-highlight';
import { usePreContext } from '../context';

export interface MarkdownCodeProps {
    class?: string;
    children?: JSX.Element;
}

export default function Code(props: MarkdownCodeProps) {
    const pre = usePreContext();

    const resolved = children(() => props.children);

    const language = () => MarkdownRenderFoundation.getCodeLanguage(props.class);

    // a rehype plugin may split the text into elements, which have no source text to highlight
    const text = () => {
        const content = resolved();
        return typeof content === 'string' ? content : undefined;
    };

    return (
        <Switch fallback={<code class={`${cssClasses.PREFIX}-simple-code`}>{resolved()}</code>}>
            <Match when={language() && text() !== undefined}>
                <CodeHighlight ref={() => pre?.markHighlighted()} code={text() ?? ''} language={language()} lineNumber />
            </Match>
            <Match when={language()}>
                <code class={props.class}>{resolved()}</code>
            </Match>
        </Switch>
    );
}
