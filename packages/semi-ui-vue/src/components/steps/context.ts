import type { ComputedRef } from 'vue';
import { createContext } from '../../base/index';
import type { StepStatus, StepsSize, StepsType } from './interface';

export interface StepsView {
    type: StepsType;
    size: StepsSize;
    current: number;
    initial: number;
    status: StepStatus;
    /** True when the parent bound onChange or onUpdate:current, which makes every step clickable */
    clickable: boolean;
}

export interface StepsContextValue {
    view: ComputedRef<StepsView>;
    /** Reports a click on step `stepNumber`; the current step is ignored */
    change: (stepNumber: number) => void;
}

export const [provideStepsContext, useStepsContext] = createContext<StepsContextValue>('Steps', { optional: true });

export interface StepItemView {
    index: number;
    total: number;
}

export const [provideStepItemContext, useStepItemContext] = createContext<ComputedRef<StepItemView>>('StepProvider', { optional: true });
