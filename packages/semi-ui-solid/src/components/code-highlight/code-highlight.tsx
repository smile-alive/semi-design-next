import { Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';
import { cssClasses } from '@fibrae/semi-foundation/components/code-highlight/constants';
import CodeHighlightFoundation, { type CodeHighlightAdapter, type CodeHighlightBaseProps, type CodeHighlightBaseState } from '@fibrae/semi-foundation/components/code-highlight/index';
import { register } from '@fibrae/semi-foundation/components/code-highlight/registry';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/code-highlight/code-highlight.scss';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';

export type { CodeHighlightRegistration, CodeHighlightThemes, LanguageInput, ThemeInput } from '@fibrae/semi-foundation/components/code-highlight/registry';

// The `code` prop is the root's only content, so children and raw content would be ignored or clash with it
export interface CodeHighlightProps extends CodeHighlightBaseProps, ElementProps<'div', 'children' | 'innerHTML' | 'textContent' | 'innerText'> {}

const defaultProps = { lineNumber: true } satisfies Partial<CodeHighlightProps>;

// The nodes come from Shiki, which escapes the code text, so they carry only its own markup
function parseHtml(html: string) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return [...template.content.childNodes];
}

function CodeHighlight(rawProps: CodeHighlightProps) {
    const props = useDefaultProps('CodeHighlight', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['code', 'language', 'lineNumber', 'languages', 'themes', 'class']);

    const { state } = useFoundation<CodeHighlightFoundation<CodeHighlightProps>, CodeHighlightAdapter<CodeHighlightProps>, CodeHighlightProps, CodeHighlightBaseState>(
        CodeHighlightFoundation,
        props,
        () => CodeHighlightFoundation.getInitialState(),
        () => ({})
    );

    const html = () => CodeHighlightFoundation.getVisibleHtml(state(), local.code);

    return (
        <div
            {...rest}
            role={namedRole(rest)}
            class={clsx(local.class, cssClasses.PREFIX, `${BASE_CLASS_PREFIX}-scrollbar`, {
                [`${cssClasses.PREFIX}-lineNumber`]: local.lineNumber,
            })}
        >
            <Show
                keyed
                when={html()}
                fallback={
                    <pre>
                        <code>{local.code}</code>
                    </pre>
                }
            >
                {(markup) => parseHtml(markup)}
            </Show>
        </div>
    );
}

export default Object.assign(CodeHighlight, { register });
