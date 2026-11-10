import type { BasicCheckboxEvent, CheckboxGroupView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
import { createContext } from '../../base/index.js';

export interface CheckboxGroupContext {
    readonly view: CheckboxGroupView;
    onChange: (event: BasicCheckboxEvent) => void;
}

export const [getCheckboxGroupContext, setCheckboxGroupContext] = createContext<CheckboxGroupContext>('CheckboxGroup', { optional: true });
