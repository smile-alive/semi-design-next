import React from 'react';
import type { ResponsiveMap, BreakpointScreens, OnBreakpointScreensCallback, OnBreakpointChangeCallback, Breakpoint } from '@fibrae/semi-foundation/config-provider/responsive-types';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { createContext } from '../_base/create-context';

export interface ContextValue {
    direction?: 'ltr' | 'rtl';
    timeZone?: string | number;
    /** `null` clears the locale inherited from an enclosing ConfigProvider, letting a LocaleProvider below take effect */
    locale?: Locale | null;
    children?: React.ReactNode;
    getPopupContainer?: () => HTMLElement;
    /**
     * Enable responsive observing in ConfigProvider (for consumers to know capability)
     */
    responsiveObserve?: boolean;
    /**
     * Custom responsive map configuration
     */
    responsiveMap?: ResponsiveMap;
    /**
     * Subscribe to breakpoint changes
     * @param callback Function to call when breakpoint changes
     * @returns Unsubscribe function
     */
    onBreakpoint?: {
        (callback: OnBreakpointScreensCallback): () => void;
        (breakpoints: Breakpoint[], callback: OnBreakpointChangeCallback): () => void;
    };
    /**
     * Current breakpoint screens state (read-only)
     */
    screens?: BreakpointScreens;
}

export const [ConfigContext, useConfigContext] = createContext<ContextValue>('ConfigProvider', { defaultValue: {} });
