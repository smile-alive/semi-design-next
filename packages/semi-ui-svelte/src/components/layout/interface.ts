import type { HTMLAttributes } from 'svelte/elements';
import type { ResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';

export type { ResponsiveMap };

export interface LayoutProps extends HTMLAttributes<HTMLElement> {
    tagName?: keyof HTMLElementTagNameMap;
    /** Forces the has-sider class, for server rendering where a nested Sider has not registered yet */
    hasSider?: boolean;
}

export interface LayoutBasicProps extends HTMLAttributes<HTMLElement> {
    tagName?: keyof HTMLElementTagNameMap;
}

export interface SiderProps extends HTMLAttributes<HTMLElement> {
    /**Breakpoints reported through `onBreakpoint`; read once at mount */
    breakpoint?: Array<keyof ResponsiveMap>;
    onBreakpoint?: (screen: keyof ResponsiveMap, match: boolean) => void;
}

export interface LayoutContextValue {
    addSider: () => void;
    removeSider: () => void;
}
