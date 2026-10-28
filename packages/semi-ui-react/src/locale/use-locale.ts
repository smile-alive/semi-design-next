import type { LocaleComponentName, LocaleResult } from '@fibrae/semi-foundation/locale/interface';
import { resolveLocale } from '@fibrae/semi-foundation/locale/resolve-locale';
import { useConfigContext } from '../config-provider/context';
import { useLocaleContext } from './context';

export type { LocaleComponentName, LocaleResult };

/**
 * The locale a component renders with: ConfigProvider's `locale`, else LocaleProvider's, else zh_CN. The hook
 * counterpart of `<LocaleConsumer componentName>`.
 */
export default function useLocale<K extends LocaleComponentName>(componentName: K) {
    const { locale: configLocale } = useConfigContext();
    const providerLocale = useLocaleContext();
    return resolveLocale(configLocale, providerLocale, componentName);
}
