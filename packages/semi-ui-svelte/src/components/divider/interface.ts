import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { DividerPart } from '@fibrae/semi-foundation/components/divider/constants';

export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'align'> {
    classNames?: Partial<Record<DividerPart, ClassValue>>;
    styles?: Partial<Record<DividerPart, string>>;
    align?: 'left' | 'right' | 'center';
    margin?: number | string;
    dashed?: boolean;
    layout?: 'horizontal' | 'vertical';
}
