import type { CheckboxContextView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
import { createContext } from '../_base/create-context';

export const [CheckboxGroupContext, useCheckboxGroupContext] = createContext<CheckboxContextView>('CheckboxGroup', { defaultValue: {} });
