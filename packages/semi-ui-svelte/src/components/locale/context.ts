import type { LocaleInput } from '@fibrae/semi-foundation/locale/index';
import { createContext } from '../../base/create-context.js';

export interface LocaleContextValue {
    readonly locale: LocaleInput | null;
}

export const [getLocaleContext, setLocaleContext] = createContext<LocaleContextValue>('LocaleProvider', { optional: true });
