import type { HTMLAttributes } from 'svelte/elements';
import type { Breakpoint } from '@fibrae/semi-foundation/grid/constants';
import type { Gutter } from '@fibrae/semi-foundation/grid/gutter';
import type { ColSize } from '@fibrae/semi-foundation/grid/utils';

export type { Breakpoint, ColSize, Gutter };

export interface RowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'align'> {
    type?: 'flex';
    align?: 'top' | 'middle' | 'bottom';
    justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
    /** A pair is [horizontal, vertical] */
    gutter?: Gutter | [Gutter, Gutter];
    prefixCls?: string;
}

export interface ColProps extends HTMLAttributes<HTMLDivElement> {
    span?: number;
    order?: number;
    offset?: number;
    push?: number;
    pull?: number;
    prefixCls?: string;
    xs?: number | ColSize;
    sm?: number | ColSize;
    md?: number | ColSize;
    lg?: number | ColSize;
    xl?: number | ColSize;
    xxl?: number | ColSize;
}
