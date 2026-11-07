import { createContext } from '../../base/create-context';

export interface ContextValue {
    type?: 'nav' | 'fill' | 'basic';
}

export const [StepsContext, useStepsContext] = createContext<ContextValue>('Steps');
