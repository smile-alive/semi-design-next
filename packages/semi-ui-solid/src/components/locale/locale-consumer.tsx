import type { JSX } from 'solid-js';
import type { Locale, LocaleComponentName } from '@fibrae/semi-foundation/locale/index';
import useLocale from './use-locale';

export interface LocaleConsumerProps<K extends LocaleComponentName> {
    componentName: K;
    children: (componentLocale: Locale[K], localeCode: string, currency: string) => JSX.Element;
}

export default function LocaleConsumer<K extends LocaleComponentName>(props: LocaleConsumerProps<K>) {
    const result = useLocale(() => props.componentName);

    return <>{props.children(result().locale, result().localeCode, result().currency)}</>;
}
