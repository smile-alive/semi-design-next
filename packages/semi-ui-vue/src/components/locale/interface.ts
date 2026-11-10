import type { VNode } from 'vue';
import type { Locale, LocaleComponentName, LocaleInput, LocaleResult } from '@fibrae/semi-foundation/locale';

export type { LocaleComponentName, LocaleResult };

export interface LocaleProviderProps {
    locale?: LocaleInput | null;
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
