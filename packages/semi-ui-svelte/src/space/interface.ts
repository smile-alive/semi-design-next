import type { HTMLAttributes } from 'svelte/elements';

export type Align = 'start' | 'center' | 'end' | 'baseline';
export type Spacing = 'loose' | 'medium' | 'tight' | number;

export interface SpaceProps extends HTMLAttributes<HTMLDivElement> {
    wrap?: boolean;
    align?: Align;
    vertical?: boolean;
    /** A pair is [horizontal, vertical] */
    spacing?: Spacing | [Spacing, Spacing];
}
