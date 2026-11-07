import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { LocaleComponentName, LocaleResult } from '@fibrae/semi-foundation/locale/interface';
import { resolveLocale } from '@fibrae/semi-foundation/locale/resolve-locale';
import useConfig from '../config-provider/use-config';
import { useLocaleContext } from './context';

export default function useLocale<K extends LocaleComponentName>(componentName: MaybeRefOrGetter<K>) {
    const config = useConfig();
    const providerLocale = useLocaleContext();

    return computed(() => resolveLocale(config.value.locale, providerLocale?.value, toValue(componentName)));
}

export type { LocaleResult };
