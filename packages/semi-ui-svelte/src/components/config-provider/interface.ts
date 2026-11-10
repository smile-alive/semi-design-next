import type { Snippet } from 'svelte';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { ResponsiveConfig } from '@fibrae/semi-foundation/components/config-provider/responsive-types';
import type { LocaleInput } from '@fibrae/semi-foundation/locale';

export interface ContextValue extends ResponsiveConfig {
    direction?: 'ltr' | 'rtl';
    timeZone?: string | number;
    locale?: LocaleInput | null;
    /** date-fns locale of DatePicker, TimePicker and Calendar; omitted: looked up by the locale code (zh-CN, en-US), else enUS */
    dateFnsLocale?: DateFnsLocale;
    getPopupContainer?: () => HTMLElement;
    responsiveObserve?: boolean;
}

export interface ConfigProviderProps extends Omit<ContextValue, 'onBreakpoint' | 'screens'> {
    children?: Snippet;
}

export interface ConfigConsumerProps {
    children: Snippet<[config: ContextValue]>;
}
