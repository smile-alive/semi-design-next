import type { BasicCheckboxEvent, CheckboxGroupView } from '@fibrae/semi-foundation/checkbox/checkbox-foundation';
import { createContext } from '../_base/create-context.js';

export interface CheckboxGroupContext {
    readonly view: CheckboxGroupView;
    onChange: (event: BasicCheckboxEvent) => void;
}

export const [getCheckboxGroupContext, setCheckboxGroupContext] = createContext<CheckboxGroupContext>('CheckboxGroup', { optional: true });
