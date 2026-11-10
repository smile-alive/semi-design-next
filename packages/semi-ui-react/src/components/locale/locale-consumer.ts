import type React from 'react';
import type { Locale } from '@fibrae/semi-foundation/locale/index';
import useLocale, { type LocaleComponentName } from './use-locale';

type ChildrenRender<T> = (componentLocale: T, localeCode: string, currency: string) => React.ReactNode;
export interface LocaleConsumerProps<K extends LocaleComponentName> {
    componentName: K;
    children?: ChildrenRender<Locale[K]>;
}

export default function LocaleConsumer<K extends LocaleComponentName>({ componentName, children }: LocaleConsumerProps<K>) {
    const { locale, localeCode, currency } = useLocale(componentName);

    return children(locale, localeCode, currency);
}
