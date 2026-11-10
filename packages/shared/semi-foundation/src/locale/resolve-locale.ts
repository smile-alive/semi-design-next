import { toMerged } from 'es-toolkit';
import type { Locale, LocaleComponentName, LocaleInput, LocaleResult } from './interface';
import en_US from './source/en_US';
import zh_CN from './source/zh_CN';

// Keyed by the caller's locale object so the same object always yields the same entry: React dependency arrays, Solid's
// memo equality, and server and client renders all compare entries by reference. A locale mutated in place keeps its
// first merge; pass a new object instead.
const filled = new WeakMap<LocaleInput, Map<LocaleComponentName, unknown>>();

function fill<K extends LocaleComponentName>(input: LocaleInput, componentName: K) {
    const own = input[componentName];
    const fallback = en_US[componentName];
    // A namespace an app adds to Locale through declaration merging has no en_US entry to fill from
    if (!own || !fallback) {
        return (own ?? fallback) as Locale[K];
    }
    let entries = filled.get(input);
    if (!entries) {
        entries = new Map();
        filled.set(input, entries);
    }
    if (!entries.has(componentName)) {
        entries.set(componentName, toMerged(en_US[componentName], own));
    }
    return entries.get(componentName) as Locale[K];
}

/**
 * The locale a component renders with: ConfigProvider's `locale`, else LocaleProvider's, else zh_CN (also when the
 * chosen locale has no `code`). Texts the chosen locale leaves out come from en_US.
 */
export function resolveLocale<K extends LocaleComponentName>(configLocale: LocaleInput | null | undefined, providerLocale: LocaleInput | null | undefined, componentName: K): LocaleResult<Locale[K]> {
    const chosen = configLocale || providerLocale;
    const locale = chosen?.code ? chosen : zh_CN;
    return {
        locale: locale === zh_CN || locale === en_US ? (locale as Locale)[componentName] : fill(locale, componentName),
        localeCode: locale.code,
        currency: locale.currency ?? en_US.currency,
    };
}
