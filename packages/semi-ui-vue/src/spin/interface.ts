import type { CSSProperties, VNode } from 'vue';

export type SpinSize = 'small' | 'large' | 'middle';

export interface SpinProps {
    size?: SpinSize;
    spinning?: boolean;
    delay?: number;
    wrapperClassName?: string;
    childStyle?: CSSProperties;
}

export interface SpinSlots {
    default?: () => VNode[];
    indicator?: () => VNode[];
    tip?: () => VNode[];
}
