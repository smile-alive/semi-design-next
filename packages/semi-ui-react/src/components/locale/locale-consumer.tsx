import type React from 'react';
import type { Locale as dateFns } from 'date-fns';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import useLocale, { type LocaleComponentName } from './use-locale';

type ChildrenRender<T> = (componentLocale: T, localeCode: string, dateFnsLocale: dateFns, currency: string) => React.ReactNode;
export interface LocaleConsumerProps<K extends LocaleComponentName> {
    componentName: K;
    children?: ChildrenRender<Locale[K]>;
}

export default function LocaleConsumer<K extends LocaleComponentName>({ componentName, children }: LocaleConsumerProps<K>) {
    const { locale, localeCode, dateFnsLocale, currency } = useLocale(componentName);

    return children(locale, localeCode, dateFnsLocale, currency);
}
