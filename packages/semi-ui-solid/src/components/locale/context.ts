import type { Accessor } from 'solid-js';
import type { LocaleInput } from '@fibrae/semi-foundation/locale/index';
import { createContext } from '../../base/create-context';

export const [LocaleContext, useLocaleContext] = createContext<Accessor<LocaleInput | null>>('LocaleProvider', { optional: true });
