import type { ComputedRef } from 'vue';
import type { BasicCheckboxEvent, CheckboxGroupView } from '@fibrae/semi-foundation/checkbox/checkbox-foundation';
import { createContext } from '../_base/create-context';

export interface CheckboxGroupContext {
    view: ComputedRef<CheckboxGroupView>;
    onChange: (event: BasicCheckboxEvent) => void;
}

export const [provideCheckboxGroupContext, useCheckboxGroupContext] = createContext<CheckboxGroupContext>('CheckboxGroup', { optional: true });
