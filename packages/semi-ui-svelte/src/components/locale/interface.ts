import type { Snippet } from 'svelte';
import type { Locale, LocaleComponentName, LocaleInput, LocaleResult } from '@fibrae/semi-foundation/locale/index';

export type { LocaleComponentName, LocaleResult };

export interface LocaleProviderProps {
    locale?: LocaleInput | null;
    children?: Snippet;
}

export interface LocaleConsumerProps<K extends LocaleComponentName> {
    componentName: K;
    children: Snippet<[result: LocaleResult<Locale[K]>]>;
}
