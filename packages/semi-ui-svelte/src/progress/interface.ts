import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { StrokeArr } from '@fibrae/semi-foundation/progress/generates';
import type { Size } from '@fibrae/semi-foundation/utils/type';

export type { StrokeArr };
export type ProgressSize = Size;
export type ProgressType = 'line' | 'circle';
export type ProgressDirection = 'horizontal' | 'vertical';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
    direction?: ProgressDirection;
    indeterminate?: boolean;
    motion?: boolean;
    orbitStroke?: string;
    percent?: number;
    showInfo?: boolean;
    size?: ProgressSize;
    stroke?: string | StrokeArr;
    strokeGradient?: boolean;
    strokeLinecap?: 'round' | 'square';
    strokeWidth?: number;
    type?: ProgressType;
    width?: number;
    /** Replaces the text; `percent` is the shown number clamped to 0-100 */
    format?: Snippet<[{ percent: number }]>;
}
