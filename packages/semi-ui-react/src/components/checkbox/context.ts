import type { CheckboxContextView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
import { createContext } from '../../base/index';

export const [CheckboxGroupContext, useCheckboxGroupContext] = createContext<CheckboxContextView>('CheckboxGroup', { defaultValue: {} });
