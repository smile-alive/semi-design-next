import type { CSSProperties } from 'react';
import type { StepsPart } from '@fibrae/semi-foundation/components/steps/constants';
import { createContext } from '../../base/index';

export interface ContextValue {
    type?: 'nav' | 'basic';
    classNames?: Partial<Record<StepsPart, string>>;
    styles?: Partial<Record<StepsPart, CSSProperties>>;
}

export const [StepsContext, useStepsContext] = createContext<ContextValue>('Steps');
