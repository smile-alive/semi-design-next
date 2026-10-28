import type React from 'react';
import { useEffect, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { cssClasses } from '@fibrae/semi-foundation/code-highlight/constants';
import CodeHighlightFoundation, { type CodeHighlightAdapter, type CodeHighlightBaseProps, type CodeHighlightBaseState } from '@fibrae/semi-foundation/code-highlight/index';
import { getVersion, register, subscribe } from '@fibrae/semi-foundation/code-highlight/registry';
import '@fibrae/semi-foundation/code-highlight/code-highlight.scss';
import type { ElementProps } from '../_base/base';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';

export type { CodeHighlightRegistration, CodeHighlightThemes, LanguageInput, ThemeInput } from '@fibrae/semi-foundation/code-highlight/registry';

// The `code` prop is the root's only content, so children and raw HTML would be ignored or clash with it
export interface CodeHighlightProps extends CodeHighlightBaseProps, ElementProps<'div', 'children' | 'dangerouslySetInnerHTML'> {
    className?: string;
    style?: React.CSSProperties;
    /** Attached to the root element */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = { lineNumber: true } satisfies Partial<CodeHighlightProps>;

function CodeHighlight(rawProps: CodeHighlightProps) {
    const props = useDefaultProps('CodeHighlight', rawProps, defaultProps);
    const { ref, code, language, lineNumber, languages, themes, className, style, ...rest } = props;

    const [foundation, { html: highlightedHtml, highlightedCode }] = useFoundation<CodeHighlightFoundation<CodeHighlightProps>, CodeHighlightAdapter<CodeHighlightProps>, CodeHighlightProps, CodeHighlightBaseState>(
        CodeHighlightFoundation,
        props,
        () => ({ html: '', highlightedCode: '' }),
        (base) => ({ setHtml: (html, highlightedCode) => base.setState({ html, highlightedCode }) })
    );

    // a grammar registered after mount (a later entry module) highlights this block again
    const registered = useSyncExternalStore(subscribe, getVersion, getVersion);

    // stale markup would lag behind a streaming `code`
    const html = highlightedCode === (props.code ?? '') ? highlightedHtml : '';

    useEffect(() => {
        void foundation.highlightCode();
    }, [foundation, code, language, languages, themes, registered]);

    return (
        <div
            role={namedRole(rest)}
            {...rest}
            ref={ref}
            className={clsx(className, cssClasses.PREFIX, `${BASE_CLASS_PREFIX}-scrollbar`, {
                [`${cssClasses.PREFIX}-lineNumber`]: lineNumber,
            })}
            style={style}
            // Shiki escapes the code text, so the markup carries only its own spans
            dangerouslySetInnerHTML={html ? { __html: html } : undefined}
        >
            {html ? undefined : (
                <pre>
                    <code>{code}</code>
                </pre>
            )}
        </div>
    );
}

export default Object.assign(CodeHighlight, { register });
