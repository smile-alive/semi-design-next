import type { ComputedRef } from 'vue';
import type { LocaleInput } from '@fibrae/semi-foundation/locale';
import { createContext } from '../../base/index';

export const [provideLocaleContext, useLocaleContext] = createContext<ComputedRef<LocaleInput | null>>('LocaleProvider', { optional: true });
