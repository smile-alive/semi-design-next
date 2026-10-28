import type { Locale, LocaleComponentName, LocaleResult } from './interface';
import zh_CN from './source/zh_CN';

/**
 * The locale a component renders with: ConfigProvider's `locale`, else LocaleProvider's, else zh_CN (also when the
 * chosen locale has no `code`).
 */
export function resolveLocale<K extends LocaleComponentName>(configLocale: Locale | null | undefined, providerLocale: Locale | null | undefined, componentName: K): LocaleResult<Locale[K]> {
    const chosen = configLocale || providerLocale;
    const locale = chosen?.code ? chosen : zh_CN;
    return {
        locale: locale[componentName],
        localeCode: locale.code,
        dateFnsLocale: locale.dateFnsLocale,
        currency: locale.currency,
    };
}
