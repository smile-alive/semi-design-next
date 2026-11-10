import React from 'react';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { ResponsiveMap, BreakpointScreens, OnBreakpointScreensCallback, OnBreakpointChangeCallback, Breakpoint } from '@fibrae/semi-foundation/components/config-provider/responsive-types';
import type { LocaleInput } from '@fibrae/semi-foundation/locale';
import { createContext } from '../../base/index';

export interface ContextValue {
    direction?: 'ltr' | 'rtl';
    timeZone?: string | number;
    /** `null` clears the locale inherited from an enclosing ConfigProvider, letting a LocaleProvider below take effect */
    locale?: LocaleInput | null;
    /** date-fns locale of DatePicker, TimePicker and Calendar; omitted: looked up by the locale code (zh-CN, en-US), else enUS */
    dateFnsLocale?: DateFnsLocale;
    children?: React.ReactNode;
    getPopupContainer?: () => HTMLElement;
    responsiveObserve?: boolean;
    responsiveMap?: ResponsiveMap;
    onBreakpoint?: {
        (callback: OnBreakpointScreensCallback): () => void;
        (breakpoints: Breakpoint[], callback: OnBreakpointChangeCallback): () => void;
    };
    screens?: BreakpointScreens;
}

export const [ConfigContext, useConfigContext] = createContext<ContextValue>('ConfigProvider', { defaultValue: {} });
