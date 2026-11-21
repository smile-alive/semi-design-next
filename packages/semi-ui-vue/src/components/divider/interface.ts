import type { ClassValue, StyleValue, VNode } from 'vue';
import type { DividerPart } from '@fibrae/semi-foundation/components/divider/constants';

export interface DividerProps {
    align?: 'left' | 'right' | 'center';
    classNames?: Partial<Record<DividerPart, ClassValue>>;
    styles?: Partial<Record<DividerPart, StyleValue>>;
    margin?: number | string;
    dashed?: boolean;
    layout?: 'horizontal' | 'vertical';
}

export interface DividerSlots {
    /** Title of a horizontal divider; a vertical divider shows no content */
    default?: () => VNode[];
}
