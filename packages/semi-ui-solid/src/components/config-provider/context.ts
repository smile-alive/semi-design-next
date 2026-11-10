import type { Accessor } from 'solid-js';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { Breakpoint, BreakpointScreens, OnBreakpointChangeCallback, OnBreakpointScreensCallback, ResponsiveMap } from '@fibrae/semi-foundation/components/config-provider/responsive-types';
import type { LocaleInput } from '@fibrae/semi-foundation/locale/index';
import { createContext } from '../../base/create-context';

export interface ContextValue {
    direction?: 'ltr' | 'rtl';
    timeZone?: string | number;
    /** `null` clears the locale inherited from an enclosing ConfigProvider, letting a LocaleProvider below take effect */
    locale?: LocaleInput | null;
    /** date-fns locale of DatePicker, TimePicker and Calendar; omitted: looked up by the locale code (zh-CN, en-US), else enUS */
    dateFnsLocale?: DateFnsLocale;
    getPopupContainer?: () => HTMLElement;
    /** Whether the ConfigProvider observes breakpoints, so consumers know `onBreakpoint` reports anything */
    responsiveObserve?: boolean;
    responsiveMap?: ResponsiveMap;
    onBreakpoint?: {
        (callback: OnBreakpointScreensCallback): () => void;
        (breakpoints: Breakpoint[], callback: OnBreakpointChangeCallback): () => void;
    };
    screens?: BreakpointScreens;
}

export const [ConfigContext, useConfigContext] = createContext<Accessor<ContextValue>>('ConfigProvider', { defaultValue: () => ({}) });
