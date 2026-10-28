import type { ComputedRef } from 'vue';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { createContext } from '../_base/create-context';

export const [provideLocaleContext, useLocaleContext] = createContext<ComputedRef<Locale | null>>('LocaleProvider', { optional: true });
