import type { BasicCheckboxEvent, CheckboxGroupView } from '@fibrae/semi-foundation/checkbox/checkbox-foundation';
import { createContext } from '../_base/create-context';
export type CheckboxContextType = {
    checkboxGroup?: CheckboxGroupView & {
        onChange: (evt: BasicCheckboxEvent) => void;
    };
};
export const [CheckboxGroupContext, useCheckboxGroupContext] = createContext<CheckboxContextType>('CheckboxGroup', { defaultValue: {} });
