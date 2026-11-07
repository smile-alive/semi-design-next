import type { Accessor } from 'solid-js';
import type { BasicCheckboxEvent, CheckboxGroupView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
import { createContext } from '../../base/create-context';

export interface CheckboxGroupContextValue {
    view: Accessor<CheckboxGroupView>;
    onChange: (event: BasicCheckboxEvent) => void;
}

export const [CheckboxGroupContext, useCheckboxGroupContext] = createContext<CheckboxGroupContextValue>('CheckboxGroup', { optional: true });
