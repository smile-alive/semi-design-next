import type { Accessor } from 'solid-js';
import type { LocaleInput } from '@fibrae/semi-foundation/locale';
import { createContext } from '../../base/index';

export const [LocaleContext, useLocaleContext] = createContext<Accessor<LocaleInput | null>>('LocaleProvider', { optional: true });
