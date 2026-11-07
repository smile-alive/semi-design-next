import type { JSX } from 'solid-js';
import type { Locale, LocaleComponentName, LocaleResult } from '@fibrae/semi-foundation/locale/interface';
import useLocale from './use-locale';

export interface LocaleConsumerProps<K extends LocaleComponentName> {
    componentName: K;
    children: (componentLocale: Locale[K], localeCode: string, dateFnsLocale: LocaleResult<Locale[K]>['dateFnsLocale'], currency: string) => JSX.Element;
}

export default function LocaleConsumer<K extends LocaleComponentName>(props: LocaleConsumerProps<K>) {
    const result = useLocale(() => props.componentName);

    return <>{props.children(result().locale, result().localeCode, result().dateFnsLocale, result().currency)}</>;
}
