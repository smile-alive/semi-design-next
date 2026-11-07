import type { HTMLAttributes } from 'svelte/elements';

export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'align'> {
    align?: 'left' | 'right' | 'center';
    margin?: number | string;
    dashed?: boolean;
    layout?: 'horizontal' | 'vertical';
}
