import type { Snippet } from 'svelte';
import { createContext } from '../_base/create-context.js';
import type { StepSnippetProps, StepStatus, StepsSize, StepsType } from './interface.js';

export interface StepsContextValue {
    type: StepsType;
    size: StepsSize;
    current: number;
    initial: number;
    status: StepStatus;
    prefixCls: string;
    /** True when the parent set onChange, which makes every step clickable */
    clickable: boolean;
    title?: Snippet<[StepSnippetProps]>;
    description?: Snippet<[StepSnippetProps]>;
    /** Reports a click on step `stepNumber`; the current step is ignored */
    change: (stepNumber: number) => void;
}

export const [getStepsContext, setStepsContext] = createContext<StepsContextValue>('Steps');
