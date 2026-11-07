import { type Accessor, createMemo } from 'solid-js';
import type { LocaleComponentName, LocaleResult } from '@fibrae/semi-foundation/locale/interface';
import { resolveLocale } from '@fibrae/semi-foundation/locale/resolve-locale';
import shallowEqualObjects from '@fibrae/semi-foundation/utils/shallow-equal-objects';
import useConfig from '../config-provider/use-config';
import { useLocaleContext } from './context';

export type { LocaleComponentName, LocaleResult };

/**
 * The locale a component renders with: ConfigProvider's `locale`, else LocaleProvider's, else zh_CN. The hook
 * counterpart of `<LocaleConsumer componentName>`.
 */
export default function useLocale<K extends LocaleComponentName>(componentName: K | Accessor<K>) {
    const config = useConfig();
    const providerLocale = useLocaleContext();

    // resolveLocale returns a new object each call; without content equality every unrelated config change (screens,
    // timeZone) would notify readers
    return createMemo(() => resolveLocale(config().locale, providerLocale?.(), typeof componentName === 'function' ? componentName() : componentName), undefined, {
        equals: shallowEqualObjects,
    });
}
