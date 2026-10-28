import type { Component, StyleValue } from 'vue';
import type { KeyedNode } from '../_base/slot-nodes';
import type { Ellipsis, TypographyBaseSize, TypographyCommonProps } from './interface';

export interface TypographyBaseProps extends TypographyCommonProps {
    code?: boolean;
    ellipsis?: Ellipsis | boolean;
    size?: TypographyBaseSize;
    spacing?: string;
    weight?: string | number;
    /** Title's tag, which also picks the heading class */
    headingTag?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
    /** The wrapper's default slot */
    nodes: KeyedNode[];
    /** Numeral's formatter of the text nodes */
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
    /** Show the nodes instead of the truncated text */
    showFull: boolean;
    ellipsisText: string;
    suffix: string;
    /** Outermost first */
    decorations: DecorationTag[];
    /** The span around the text inside a link, or undefined without a link */
    linkClass?: unknown;
    iconSize: 'small' | 'default';
    /** Text of the expand or collapse button; no button when undefined */
    actionText?: string;
    /** Whether the button toggles `expanded`; only then it is a disclosure with aria-expanded */
    actionToggles: boolean;
    expanded: boolean;
    copy: false | ResolvedCopyConfig;
}

export interface EllipsisView {
    isOverflowed: boolean;
    ellipsisContent: string;
    expanded: boolean;
    isTruncated: boolean;
}
