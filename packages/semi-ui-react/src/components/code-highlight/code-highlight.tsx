import type React from 'react';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { cssClasses } from '@fibrae/semi-foundation/components/code-highlight/constants';
import CodeHighlightFoundation, { type CodeHighlightAdapter, type CodeHighlightBaseProps, type CodeHighlightBaseState } from '@fibrae/semi-foundation/components/code-highlight/index';
import { register } from '@fibrae/semi-foundation/components/code-highlight/registry';
import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/components/code-highlight/code-highlight.scss';
import type { ElementProps } from '../../base/base';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';

type Foundation = CodeHighlightFoundation<CodeHighlightProps>;
type Adapter = CodeHighlightAdapter<CodeHighlightProps>;

export type { CodeHighlightRegistration, CodeHighlightThemes, LanguageInput, ThemeInput } from '@fibrae/semi-foundation/components/code-highlight/registry';

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

    const [, state] = useFoundation<Foundation, Adapter, CodeHighlightProps, CodeHighlightBaseState>(
        CodeHighlightFoundation,
        props,
        () => CodeHighlightFoundation.getInitialState(),
        () => ({})
    );

    const html = CodeHighlightFoundation.getVisibleHtml(state, props.code);

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
