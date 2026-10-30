import type { Snippet } from 'svelte';
import type { Locale, LocaleComponentName, LocaleResult } from '@fibrae/semi-foundation/locale/interface';

export type { LocaleComponentName, LocaleResult };

export interface LocaleProviderProps {
    locale?: Locale | null;
    children?: Snippet;
}

export interface LocaleConsumerProps<K extends LocaleComponentName> {
    componentName: K;
    children: Snippet<[result: LocaleResult<Locale[K]>]>;
}
