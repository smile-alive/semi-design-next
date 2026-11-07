import type { VNode } from 'vue';

export interface DividerProps {
    align?: 'left' | 'right' | 'center';
    margin?: number | string;
    dashed?: boolean;
    layout?: 'horizontal' | 'vertical';
}

export interface DividerSlots {
    /** Title of a horizontal divider; a vertical divider shows no content */
    default?: () => VNode[];
}
