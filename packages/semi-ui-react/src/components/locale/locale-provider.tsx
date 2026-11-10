import type React from 'react';
import type { LocaleInput } from '@fibrae/semi-foundation/locale';
import { LocaleContext, useLocaleContext } from './context';

export interface LocaleProviderProps {
    children?: React.ReactNode;
    /** omitted or null: inherits the enclosing LocaleProvider's locale; useLocale falls back to zh_CN at the top */
    locale?: LocaleInput | null;
}

export default function LocaleProvider({ children, locale }: LocaleProviderProps) {
    const inherited = useLocaleContext();

    return <LocaleContext value={locale ?? inherited}>{children}</LocaleContext>;
}
