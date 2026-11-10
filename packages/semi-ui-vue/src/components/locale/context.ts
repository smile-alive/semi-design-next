import type { ComputedRef } from 'vue';
import type { LocaleInput } from '@fibrae/semi-foundation/locale/index';
import { createContext } from '../../base/create-context';

export const [provideLocaleContext, useLocaleContext] = createContext<ComputedRef<LocaleInput | null>>('LocaleProvider', { optional: true });
