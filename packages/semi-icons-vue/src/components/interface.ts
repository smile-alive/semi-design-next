import type { VNode } from 'vue';

export type IconSize = 'inherit' | 'extra-small' | 'small' | 'default' | 'large' | 'extra-large';

export interface IconProps {
    size?: IconSize;
    spin?: boolean;
    rotate?: number;
    prefixCls?: string;
    type?: string;
    fill?: string | string[];
}

export interface IconSlots {
    default?: () => VNode[];
}
