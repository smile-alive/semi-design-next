import type { ClassValue, StyleValue, VNode } from 'vue';
import type { StepPart, StepsPart } from '@fibrae/semi-foundation/components/steps/constants';
import type { StepStatus } from '@fibrae/semi-foundation/components/steps/utils';

export type { StepStatus };
export type StepsSize = 'default' | 'small';
export type StepsDirection = 'horizontal' | 'vertical';
export type StepsType = 'basic' | 'nav';

/**
 * One interface for the two types: `size` applies to basic and nav, `hasLine`, `status` and `direction` to basic;
 * nav ignores them.
 */
export interface StepsProps {
    type?: StepsType;
    current?: number;
    initial?: number;
    direction?: StepsDirection;
    status?: StepStatus;
    size?: StepsSize;
    hasLine?: boolean;
    classNames?: Partial<Record<StepsPart, ClassValue>>;
    styles?: Partial<Record<StepsPart, StyleValue>>;
    /**
     * A function prop rather than an emit: whether a listener is bound decides if the steps are buttons, and a
     * component cannot see the listeners of its declared emits.
     */
    onChange?: (current: number) => void;
    /** Bound by `v-model:current`; like onChange it makes every step clickable */
    'onUpdate:current'?: (current: number) => void;
}

export interface StepsSlots {
    default?: () => VNode[];
}

export interface StepProps {
    /** Own status; when omitted it follows the parent's current and status */
    status?: StepStatus;
    classNames?: Partial<Record<StepPart, ClassValue>>;
    styles?: Partial<Record<StepPart, StyleValue>>;
}

export interface StepSlots {
    title?: () => VNode[];
    /** Not rendered by the nav type */
    description?: () => VNode[];
    /** Present means custom: empty content shows no icon. Not rendered by the nav type */
    icon?: () => VNode[];
}
