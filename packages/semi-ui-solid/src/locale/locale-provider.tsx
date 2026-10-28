import { type JSX, createMemo } from 'solid-js';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { LocaleContext, useLocaleContext } from './context';

export interface LocaleProviderProps {
    /** omitted or null: inherits the enclosing LocaleProvider's locale; useLocale falls back to zh_CN at the top */
    locale?: Locale | null;
    children?: JSX.Element;
}

export default function LocaleProvider(props: LocaleProviderProps) {
    const inherited = useLocaleContext();

    const locale = createMemo(() => props.locale ?? inherited?.() ?? null);

    return <LocaleContext.Provider value={locale}>{props.children}</LocaleContext.Provider>;
}
