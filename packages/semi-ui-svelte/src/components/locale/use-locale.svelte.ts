import type { LocaleComponentName } from '@fibrae/semi-foundation/locale/interface';
import { resolveLocale } from '@fibrae/semi-foundation/locale/resolve-locale';
import { getConfigContext } from '../config-provider/context.js';
import { getLocaleContext } from './context.js';

/**
 * The component's locale texts, ConfigProvider first, then LocaleProvider, then zh_CN. Call it during component
 * initialisation; read the result as `locale().locale.x` so the texts follow a provider's locale change.
 */
export default function useLocale<K extends LocaleComponentName>(componentName: K | (() => K)) {
    const config = getConfigContext();
    const provider = getLocaleContext();

    const result = $derived(resolveLocale(config.locale, provider?.locale, typeof componentName === 'function' ? componentName() : componentName));

    return () => result;
}
