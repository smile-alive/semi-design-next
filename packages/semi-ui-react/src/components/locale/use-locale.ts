import { type LocaleComponentName, type LocaleResult, resolveLocale } from '@fibrae/semi-foundation/locale';
import { useConfigContext } from '../config-provider/context';
import { useLocaleContext } from './context';

export type { LocaleComponentName, LocaleResult };

export default function useLocale<K extends LocaleComponentName>(componentName: K) {
    const { locale: configLocale } = useConfigContext();
    const providerLocale = useLocaleContext();
    return resolveLocale(configLocale, providerLocale, componentName);
}
