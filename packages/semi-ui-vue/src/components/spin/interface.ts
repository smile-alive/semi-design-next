import type { ClassValue, StyleValue, VNode } from 'vue';
import type { SpinPart } from '@fibrae/semi-foundation/components/spin/constants';

export type SpinSize = 'small' | 'large' | 'middle';

export interface SpinProps {
    size?: SpinSize;
    spinning?: boolean;
    delay?: number;
    classNames?: Partial<Record<SpinPart, ClassValue>>;
    styles?: Partial<Record<SpinPart, StyleValue>>;
}

export interface SpinSlots {
    default?: () => VNode[];
    indicator?: () => VNode[];
    tip?: () => VNode[];
}
