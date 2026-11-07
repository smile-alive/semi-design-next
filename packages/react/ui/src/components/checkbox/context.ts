import type { CheckboxContextView } from '@fibrae/semi-foundation/components/checkbox/checkbox-foundation';
import { createContext } from '../../base/create-context';

export const [CheckboxGroupContext, useCheckboxGroupContext] = createContext<CheckboxContextView>('CheckboxGroup', { defaultValue: {} });
