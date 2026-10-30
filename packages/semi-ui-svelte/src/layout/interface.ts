import type { HTMLAttributes } from 'svelte/elements';
import type { ResponsiveMap } from '@fibrae/semi-foundation/grid/constants';

export type { ResponsiveMap };

export interface LayoutProps extends HTMLAttributes<HTMLElement> {
    prefixCls?: string;
    /** Tag of the root element */
    tagName?: keyof HTMLElementTagNameMap;
    /** Forces the has-sider class, for server rendering where a nested Sider has not registered yet */
    hasSider?: boolean;
}

/** Props of Header, Footer and Content */
export interface LayoutBasicProps extends HTMLAttributes<HTMLElement> {
    prefixCls?: string;
    tagName?: keyof HTMLElementTagNameMap;
    type?: string;
}

export interface SiderProps extends HTMLAttributes<HTMLElement> {
    prefixCls?: string;
    /** Breakpoints reported through `onBreakpoint`; read once at mount */
    breakpoint?: Array<keyof ResponsiveMap>;
    onBreakpoint?: (screen: keyof ResponsiveMap, match: boolean) => void;
}

export interface LayoutContextValue {
    addSider: () => void;
    removeSider: () => void;
}
