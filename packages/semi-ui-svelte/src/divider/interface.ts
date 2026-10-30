import type { HTMLAttributes } from 'svelte/elements';

export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'align'> {
    /** The position of title inside divider */
    align?: 'left' | 'right' | 'center';
    /** Space between divider and surroundings */
    margin?: number | string;
    /** Whether line is dashed */
    dashed?: boolean;
    /** The direction type of divider */
    layout?: 'horizontal' | 'vertical';
}
