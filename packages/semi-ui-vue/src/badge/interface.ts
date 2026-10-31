import type { CSSProperties, VNode } from 'vue';

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
    countClassName?: string;
    countStyle?: CSSProperties;
}

export interface BadgeSlots {
    default?: () => VNode[];
    /** Custom badge content; replaces `count` and the type and theme classes */
    count?: () => VNode[];
}
