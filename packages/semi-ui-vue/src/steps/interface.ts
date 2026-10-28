import type { VNode } from 'vue';
import type { StepStatus } from '@fibrae/semi-foundation/steps/utils';

export type { StepStatus };
export type StepsSize = 'default' | 'small';
export type StepsDirection = 'horizontal' | 'vertical';
export type StepsType = 'fill' | 'basic' | 'nav';

/**
 * One interface for the three types: `size` applies to basic and nav, `hasLine` to basic, `status` and
 * `direction` to fill and basic; the others ignore them.
 */
export interface StepsProps {
    type?: StepsType;
    current?: number;
    initial?: number;
    direction?: StepsDirection;
    status?: StepStatus;
    size?: StepsSize;
    hasLine?: boolean;
    prefixCls?: string;
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
}

export interface StepSlots {
    title?: () => VNode[];
    /** Not rendered by the nav type */
    description?: () => VNode[];
    /** Present means custom: empty content shows no icon. Not rendered by the nav type */
    icon?: () => VNode[];
}
