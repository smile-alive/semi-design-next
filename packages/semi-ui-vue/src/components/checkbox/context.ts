import type { ComputedRef } from 'vue';
import type { BasicCheckboxEvent, CheckboxGroupView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
import { createContext } from '../../base/index';
import type { CheckboxGroupProps } from './interface';

export interface CheckboxGroupContext {
    view: ComputedRef<CheckboxGroupView>;
    classNames: ComputedRef<CheckboxGroupProps['classNames']>;
    styles: ComputedRef<CheckboxGroupProps['styles']>;
    onChange: (event: BasicCheckboxEvent) => void;
}

export const [provideCheckboxGroupContext, useCheckboxGroupContext] = createContext<CheckboxGroupContext>('CheckboxGroup', { optional: true });
