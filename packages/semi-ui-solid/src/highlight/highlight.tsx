import { createMemo, type JSX, Index, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/highlight/constants';
import { findAll, type HighlightStyle } from '@fibrae/semi-foundation/highlight/foundation';
import '@fibrae/semi-foundation/highlight/highlight.scss';
import useDefaultProps from '../_base/use-default-props';

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
    /** Tag of each highlighted chunk */
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

    const chunks = createMemo(() => {
        const searchWords = props.searchWords ?? [];
        return findAll({
            sourceString: props.sourceString,
            // the foundation names a word's class `className`
            searchWords: typeof searchWords === 'string' ? searchWords : searchWords.map((word) => (word && typeof word === 'object' ? { text: word.text, className: word.class, style: word.style as HighlightStyle } : word)),
            caseSensitive: props.caseSensitive,
            autoEscape: props.autoEscape,
        }).map((chunk) => ({ ...chunk, text: props.sourceString.slice(chunk.start, chunk.end) }));
    });

    return (
        <Index each={chunks()}>
            {(chunk) => (
                <Show when={chunk().highlight} fallback={chunk().text}>
                    <Dynamic component={props.component || 'mark'} class={clsx(`${prefixCls}-tag`, props.highlightClassName, chunk().className)} style={{ ...props.highlightStyle, ...chunk().style }}>
                        {chunk().text}
                    </Dynamic>
                </Show>
            )}
        </Index>
    );
}
