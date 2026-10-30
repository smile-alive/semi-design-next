import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { createContext } from '../_base/create-context.js';

export interface LocaleContextValue {
    readonly locale: Locale | null;
}

export const [getLocaleContext, setLocaleContext] = createContext<LocaleContextValue>('LocaleProvider', { optional: true });
