import type { Breakpoint, ResponsiveMap } from '../grid/constants';

export type { Breakpoint, ResponsiveMap };

export interface BreakpointScreens {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
    xxl: boolean;
}

export type OnBreakpointScreensCallback = (screens: BreakpointScreens) => void;

export type OnBreakpointChangeCallback = (screen: Breakpoint, match: boolean) => void;

export interface ResponsiveConfig {
    responsiveMap?: ResponsiveMap;

    onBreakpoint?: {
        (callback: OnBreakpointScreensCallback): () => void;
        (breakpoints: Breakpoint[], callback: OnBreakpointChangeCallback): () => void;
    };

    screens?: BreakpointScreens;
}
