import type { VNode } from 'vue';
import type { ResponsiveConfig } from '@fibrae/semi-foundation/config-provider/responsive-types';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';

export interface ContextValue extends ResponsiveConfig {
    direction?: 'ltr' | 'rtl';
    timeZone?: string | number;
    locale?: Locale | null;
    getPopupContainer?: () => HTMLElement;
    responsiveObserve?: boolean;
}

export type ConfigProviderProps = Omit<ContextValue, 'onBreakpoint' | 'screens'>;

export interface ConfigProviderSlots {
    default?(): VNode[];
}

export interface ConfigConsumerSlots {
    default?(config: ContextValue): VNode[];
}
