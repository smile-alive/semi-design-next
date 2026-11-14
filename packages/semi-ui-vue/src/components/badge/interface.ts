import type { ClassValue, StyleValue, VNode } from 'vue';
import type { BadgePart } from '@fibrae/semi-foundation/components/badge/constants';

export type BadgeType = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'success';
export type BadgeTheme = 'solid' | 'light' | 'inverted';
export type BadgePosition = 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';

export interface BadgeProps {
    count?: number | string;
    dot?: boolean;
    type?: BadgeType;
    theme?: BadgeTheme;
    /** Defaults to `leftTop` in an RTL ConfigProvider and `rightTop` otherwise */
    position?: BadgePosition;
    overflowCount?: number;
    classNames?: Partial<Record<BadgePart, ClassValue>>;
    styles?: Partial<Record<BadgePart, StyleValue>>;
}

export interface BadgeSlots {
    default?: () => VNode[];
    /** Custom badge content; replaces `count` and the type and theme classes */
    count?: () => VNode[];
}
