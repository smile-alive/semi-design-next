import type { LocaleInput } from '@fibrae/semi-foundation/locale/index';
import { createContext } from '../../base/create-context';

export const [LocaleContext, useLocaleContext] = createContext<LocaleInput>('LocaleProvider', { optional: true });
