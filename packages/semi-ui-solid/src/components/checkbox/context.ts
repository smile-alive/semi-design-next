import type { Accessor, JSX } from 'solid-js';
import type { BasicCheckboxEvent, CheckboxGroupView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
import type { CheckboxGroupPart } from '@fibrae/semi-foundation/components/checkbox/constants';
import { createContext } from '../../base/index';

export interface CheckboxGroupContextValue {
    view: Accessor<CheckboxGroupView>;
    classNames?: Partial<Record<CheckboxGroupPart, string>>;
    styles?: Partial<Record<CheckboxGroupPart, JSX.CSSProperties | string>>;
    onChange: (event: BasicCheckboxEvent) => void;
}

export const [CheckboxGroupContext, useCheckboxGroupContext] = createContext<CheckboxGroupContextValue>('CheckboxGroup', { optional: true });
