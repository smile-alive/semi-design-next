import type { LocaleInput } from '@fibrae/semi-foundation/locale';
import { createContext } from '../../base/index.js';

export interface LocaleContextValue {
    readonly locale: LocaleInput | null;
}

export const [getLocaleContext, setLocaleContext] = createContext<LocaleContextValue>('LocaleProvider', { optional: true });
