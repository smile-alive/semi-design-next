import type { VNode } from 'vue';

export interface DividerProps {
    /** The position of title inside divider */
    align?: 'left' | 'right' | 'center';
    /** Space between divider and surroundings */
    margin?: number | string;
    /** Whether line is dashed */
    dashed?: boolean;
    /** The direction type of divider */
    layout?: 'horizontal' | 'vertical';
}

export interface DividerSlots {
    /** Title of a horizontal divider; a vertical divider shows no content */
    default?: () => VNode[];
}
