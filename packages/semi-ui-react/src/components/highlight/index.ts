import type React from 'react';
import { createElement, memo } from 'react';
import clsx from 'clsx';
import { type HighlightPart, cssClasses } from '@fibrae/semi-foundation/components/highlight/constants';
import { findAll, type HighlightStyle } from '@fibrae/semi-foundation/components/highlight/foundation';
import '@fibrae/semi-foundation/components/highlight/highlight.scss';
import { useDefaultProps } from '../../base/index';

interface ComplexSearchWord {
    text: string;
    className?: string;
    style?: HighlightStyle;
}

type SearchWords = (string | ComplexSearchWord | undefined)[];

export interface HighlightProps {
    autoEscape?: boolean;
    caseSensitive?: boolean;
    sourceString?: string;
    searchWords?: string | SearchWords;
    classNames?: Partial<Record<HighlightPart, string>>;
    styles?: Partial<Record<HighlightPart, React.CSSProperties>>;
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
function Highlight(rawProps: HighlightProps): React.ReactNode[] {
    const { searchWords = [], sourceString, component, classNames, styles, caseSensitive, autoEscape } = useDefaultProps('Highlight', rawProps, defaultProps);

    const tagCls = clsx(`${prefixCls}-tag`, classNames?.highlight);

    // the foundation names a word's class `class`
    const words = typeof searchWords === 'string' ? searchWords : searchWords.map((word) => (word && typeof word === 'object' ? { text: word.text, class: word.className, style: word.style } : word));

    return findAll({ sourceString, searchWords: words, caseSensitive, autoEscape }).map(({ highlight, style, class: className, text }, index) => {
        if (!highlight) {
            return text;
        }
        return createElement(component || 'mark', { style: { ...styles?.highlight, ...style }, className: clsx(tagCls, className), key: index }, text);
    });
}

export default memo(Highlight);
