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

/**
 * Subscribe callback: get all breakpoint matches
 */
export type OnBreakpointScreensCallback = (screens: BreakpointScreens) => void;

/**
 * Subscribe callback: get single breakpoint change
 */
export type OnBreakpointChangeCallback = (screen: Breakpoint, match: boolean) => void;

export interface ResponsiveConfig {
    /**
     * Custom responsive map
     */
    responsiveMap?: ResponsiveMap;

    /**
     * Subscribe to breakpoint changes. Returns an unsubscribe function.
     *
     * Overloads:
     * - onBreakpoint(callback): callback receives full screens map
     * - onBreakpoint(breakpoints, callback): callback receives (screen, match)
     */
    onBreakpoint?: {
        (callback: OnBreakpointScreensCallback): () => void;
        (breakpoints: Breakpoint[], callback: OnBreakpointChangeCallback): () => void;
    };

    /**
     * Current breakpoint screens (read-only)
     */
    screens?: BreakpointScreens;
}
