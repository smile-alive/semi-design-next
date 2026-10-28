import type { VNode } from 'vue';

export type Align = 'start' | 'center' | 'end' | 'baseline';
export type Spacing = 'loose' | 'medium' | 'tight' | number;

export interface SpaceProps {
    wrap?: boolean;
    align?: Align;
    vertical?: boolean;
    /** A pair is [horizontal, vertical] */
    spacing?: Spacing | [Spacing, Spacing];
}

export interface SpaceSlots {
    default?: () => VNode[];
}
