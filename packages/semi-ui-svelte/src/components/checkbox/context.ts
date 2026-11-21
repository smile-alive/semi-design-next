import type { BasicCheckboxEvent, CheckboxGroupView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
import { createContext } from '../../base/index.js';
import type { CheckboxGroupProps } from './interface.js';

export interface CheckboxGroupContext {
    readonly view: CheckboxGroupView;
    readonly classNames: CheckboxGroupProps['classNames'];
    readonly styles: CheckboxGroupProps['styles'];
    onChange: (event: BasicCheckboxEvent) => void;
}

export const [getCheckboxGroupContext, setCheckboxGroupContext] = createContext<CheckboxGroupContext>('CheckboxGroup', { optional: true });
