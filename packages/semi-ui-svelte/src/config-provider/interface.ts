import type { Snippet } from 'svelte';
import type { ResponsiveConfig } from '@fibrae/semi-foundation/config-provider/responsive-types';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';

export interface ContextValue extends ResponsiveConfig {
    direction?: 'ltr' | 'rtl';
    timeZone?: string | number;
    locale?: Locale | null;
    getPopupContainer?: () => HTMLElement;
    responsiveObserve?: boolean;
}

export interface ConfigProviderProps extends Omit<ContextValue, 'onBreakpoint' | 'screens'> {
    children?: Snippet;
}

export interface ConfigConsumerProps {
    children: Snippet<[config: ContextValue]>;
}
