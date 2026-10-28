import type { Accessor } from 'solid-js';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { createContext } from '../_base/create-context';

export const [LocaleContext, useLocaleContext] = createContext<Accessor<Locale | null>>('LocaleProvider', { optional: true });
