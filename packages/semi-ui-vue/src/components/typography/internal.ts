import type { Component, StyleValue } from 'vue';
import type { ExpandButton } from '@fibrae/semi-foundation/components/typography/ellipsis';
import type { KeyedNode } from '../../utils/index';
import type { Ellipsis, TypographyBaseSize, TypographyCommonProps } from './interface';

export interface TypographyBaseProps extends TypographyCommonProps {
    code?: boolean;
    ellipsis?: Ellipsis | boolean;
    size?: TypographyBaseSize;
    spacing?: string;
    weight?: string | number;
    headingTag?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
    nodes: KeyedNode[];
    format?: (value: string) => string;
}

export interface ResolvedCopyConfig {
    content: string;
    duration: number;
    class?: unknown;
    style?: StyleValue;
}

export interface DecorationTag {
    tag: string;
    attrs: Record<string, unknown>;
}

export interface ContentProps {
    tag: string | Component;
    nodes: KeyedNode[];
    format?: (value: string) => string;
    hasEllipsis: boolean;
    showFull: boolean;
    ellipsisText: string;
    suffix: string;
    /** Outermost first */
    decorations: DecorationTag[];
    /** The span around the text inside a link, or undefined without a link */
    linkClass?: unknown;
    iconSize: 'small' | 'default';
    /** The expand or collapse button; none when undefined */
    action?: ExpandButton;
    copy: false | ResolvedCopyConfig;
}

export interface EllipsisView {
    isOverflowed: boolean;
    ellipsisContent: string;
    expanded: boolean;
    isTruncated: boolean;
}
