import type React from 'react';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { LocaleContext, useLocaleContext } from './context';

export interface LocaleProviderProps {
    children?: React.ReactNode;
    /** omitted or null: inherits the enclosing LocaleProvider's locale; useLocale falls back to zh_CN at the top */
    locale?: Locale | null;
}

export default function LocaleProvider({ children, locale }: LocaleProviderProps) {
    const inherited = useLocaleContext();

    return <LocaleContext value={locale ?? inherited}>{children}</LocaleContext>;
}
