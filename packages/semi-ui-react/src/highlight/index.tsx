import type React from 'react';
import { createElement, memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/highlight/constants';
import { findAll, type SearchWords } from '@fibrae/semi-foundation/highlight/foundation';
import '@fibrae/semi-foundation/highlight/highlight.scss';
import useDefaultProps from '../_base/use-default-props';

export interface HighlightProps {
    autoEscape?: boolean;
    caseSensitive?: boolean;
    sourceString?: string;
    searchWords?: string | SearchWords;
    highlightStyle?: React.CSSProperties;
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
function Highlight(rawProps: HighlightProps): React.ReactNode[] {
    const { searchWords = [], sourceString, component, highlightClassName, highlightStyle, caseSensitive, autoEscape } = useDefaultProps('Highlight', rawProps, defaultProps);

    const tagCls = clsx(`${prefixCls}-tag`, highlightClassName);

    return findAll({ sourceString, searchWords, caseSensitive, autoEscape }).map(({ start, end, highlight, style, className }, index) => {
        const text = sourceString.slice(start, end);
        if (!highlight) {
            return text;
        }
        return createElement(component || 'mark', { style: { ...highlightStyle, ...style }, className: clsx(tagCls, className), key: index }, text);
    });
}

export default memo(Highlight);
