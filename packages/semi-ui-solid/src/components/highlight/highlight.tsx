import { createMemo, type JSX, Index, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/highlight/constants';
import { findAll, type SearchWords as CoreSearchWords } from '@fibrae/semi-foundation/components/highlight/foundation';
import '@fibrae/semi-foundation/components/highlight/highlight.scss';
import { useDefaultProps } from '../../base/index';

export interface ComplexSearchWord {
    text: string;
    class?: string;
    style?: JSX.CSSProperties;
}

export type SearchWord = string | ComplexSearchWord | undefined;
export type SearchWords = SearchWord[];

export interface HighlightProps {
    autoEscape?: boolean;
    caseSensitive?: boolean;
    sourceString?: string;
    searchWords?: string | SearchWords;
    highlightStyle?: JSX.CSSProperties;
    highlightClassName?: string;
    component?: string;
}

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    component: 'mark',
    autoEscape: true,
    caseSensitive: false,
    sourceString: '',
} satisfies Partial<HighlightProps>;

/** Renders the chunks inline with no wrapper, so there is no root for a ref or extra props */
export default function Highlight(rawProps: HighlightProps) {
    const props = useDefaultProps('Highlight', rawProps, defaultProps);

    const chunks = createMemo(() =>
        findAll({
            sourceString: props.sourceString,
            // the foundation types a word's style as plain values
            searchWords: (props.searchWords ?? []) as string | CoreSearchWords,
            caseSensitive: props.caseSensitive,
            autoEscape: props.autoEscape,
        })
    );

    return (
        <Index each={chunks()}>
            {(chunk) => (
                <Show when={chunk().highlight} fallback={chunk().text}>
                    <Dynamic component={props.component || 'mark'} class={clsx(`${prefixCls}-tag`, props.highlightClassName, chunk().class)} style={{ ...props.highlightStyle, ...chunk().style }}>
                        {chunk().text}
                    </Dynamic>
                </Show>
            )}
        </Index>
    );
}
