import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { createContext } from '../_base/create-context';

export const [LocaleContext, useLocaleContext] = createContext<Locale>('LocaleProvider', { optional: true });
