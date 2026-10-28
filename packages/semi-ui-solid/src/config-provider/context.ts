import type { Accessor } from 'solid-js';
import type { Breakpoint, BreakpointScreens, OnBreakpointChangeCallback, OnBreakpointScreensCallback, ResponsiveMap } from '@fibrae/semi-foundation/config-provider/responsive-types';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { createContext } from '../_base/create-context';

export interface ContextValue {
    direction?: 'ltr' | 'rtl';
    timeZone?: string | number;
    /** `null` clears the locale inherited from an enclosing ConfigProvider, letting a LocaleProvider below take effect */
    locale?: Locale | null;
    getPopupContainer?: () => HTMLElement;
    /** Whether the ConfigProvider observes breakpoints, so consumers know `onBreakpoint` reports anything */
    responsiveObserve?: boolean;
    responsiveMap?: ResponsiveMap;
    /** Subscribes to breakpoint changes and returns the unsubscribe function */
    onBreakpoint?: {
        (callback: OnBreakpointScreensCallback): () => void;
        (breakpoints: Breakpoint[], callback: OnBreakpointChangeCallback): () => void;
    };
    /** The current breakpoint matches, read-only */
    screens?: BreakpointScreens;
}

export const [ConfigContext, useConfigContext] = createContext<Accessor<ContextValue>>('ConfigProvider', { defaultValue: () => ({}) });
