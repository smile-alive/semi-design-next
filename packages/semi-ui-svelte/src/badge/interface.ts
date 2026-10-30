import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type BadgeType = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'success';
export type BadgeTheme = 'solid' | 'light' | 'inverted';
export type BadgePosition = 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
    /** Text or number shown in the badge; a snippet replaces the content together with the type and theme classes */
    count?: number | string | Snippet | null;
    dot?: boolean;
    type?: BadgeType;
    theme?: BadgeTheme;
    /** Defaults to `leftTop` in an RTL ConfigProvider and `rightTop` otherwise */
    position?: BadgePosition;
    overflowCount?: number;
    countClassName?: string;
    countStyle?: string;
    /** The element the badge is attached to */
    children?: Snippet;
}
