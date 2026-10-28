import type { VNode } from 'vue';
import type { Locale, LocaleComponentName, LocaleResult } from '@fibrae/semi-foundation/locale/interface';

export type { LocaleComponentName, LocaleResult };

export interface LocaleProviderProps {
    locale?: Locale | null;
}

export interface LocaleProviderSlots {
    default?(): VNode[];
}

export interface LocaleConsumerProps<K extends LocaleComponentName> {
    componentName: K;
}

export interface LocaleConsumerSlots<K extends LocaleComponentName> {
    default?(result: LocaleResult<Locale[K]>): VNode[];
}
