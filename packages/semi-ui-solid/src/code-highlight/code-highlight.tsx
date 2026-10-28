import { createEffect, createSignal, on, onCleanup, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { cssClasses } from '@fibrae/semi-foundation/code-highlight/constants';
import CodeHighlightFoundation, { type CodeHighlightAdapter, type CodeHighlightBaseProps, type CodeHighlightBaseState } from '@fibrae/semi-foundation/code-highlight/index';
import { getVersion, register, subscribe } from '@fibrae/semi-foundation/code-highlight/registry';
import '@fibrae/semi-foundation/code-highlight/code-highlight.scss';
import type { ElementProps } from '../_base/element-props';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';

export type { CodeHighlightRegistration, CodeHighlightThemes, LanguageInput, ThemeInput } from '@fibrae/semi-foundation/code-highlight/registry';

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

    // a grammar registered after mount (a later entry module) highlights this block again
    const [registered, setRegistered] = createSignal(getVersion());

    const { foundation, state } = useFoundation<CodeHighlightFoundation<CodeHighlightProps>, CodeHighlightAdapter<CodeHighlightProps>, CodeHighlightProps, CodeHighlightBaseState>(
        CodeHighlightFoundation,
        props,
        () => ({ html: '', highlightedCode: '' }),
        (base) => ({ setHtml: (html, highlightedCode) => base.setState({ html, highlightedCode }) })
    );

    // stale markup would lag behind a streaming `code`
    const html = () => (state().highlightedCode === (local.code ?? '') ? state().html : '');

    createEffect(on([() => local.code, () => local.language, () => local.languages, () => local.themes, registered], () => void foundation.highlightCode()));

    onCleanup(subscribe(() => setRegistered(getVersion())));

    return (
        <div
            {...rest}
            role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']}
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
