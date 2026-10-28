import { createContext } from '../_base/create-context';

export interface ContextValue {
    type?: 'nav' | 'fill' | 'basic';
}

export const [StepsContext, useStepsContext] = createContext<ContextValue>('Steps');
