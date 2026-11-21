import type { CSSProperties } from 'react';
import type { CheckboxContextView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
import type { CheckboxGroupPart } from '@fibrae/semi-foundation/components/checkbox/constants';
import { createContext } from '../../base/index';

export interface CheckboxGroupContextValue extends CheckboxContextView {
    classNames?: Partial<Record<CheckboxGroupPart, string>>;
    styles?: Partial<Record<CheckboxGroupPart, CSSProperties>>;
}

export const [CheckboxGroupContext, useCheckboxGroupContext] = createContext<CheckboxGroupContextValue>('CheckboxGroup', { defaultValue: {} });
