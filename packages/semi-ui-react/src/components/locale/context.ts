import type { LocaleInput } from '@fibrae/semi-foundation/locale';
import { createContext } from '../../base/index';

export const [LocaleContext, useLocaleContext] = createContext<LocaleInput>('LocaleProvider', { optional: true });
