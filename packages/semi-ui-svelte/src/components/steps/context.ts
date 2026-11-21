import type { Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';
import type { StepsPart } from '@fibrae/semi-foundation/components/steps/constants';
import { createContext } from '../../base/index.js';
import type { StepSnippetProps, StepStatus, StepsSize, StepsType } from './interface.js';

export interface StepsContextValue {
    type: StepsType;
    size: StepsSize;
    current: number;
    initial: number;
    status: StepStatus;
    classNames?: Partial<Record<StepsPart, ClassValue>>;
    styles?: Partial<Record<StepsPart, string>>;
    /** True when the parent set onChange, which makes every step clickable */
    clickable: boolean;
    title?: Snippet<[StepSnippetProps]>;
    description?: Snippet<[StepSnippetProps]>;
    change: (stepNumber: number) => void;
}

export const [getStepsContext, setStepsContext] = createContext<StepsContextValue>('Steps');
