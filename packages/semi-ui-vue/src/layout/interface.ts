import type { VNode } from 'vue';
import type { ResponsiveMap } from '@fibrae/semi-foundation/grid/constants';

export type { ResponsiveMap };

export interface LayoutProps {
    prefixCls?: string;
    tagName?: keyof HTMLElementTagNameMap;
    /** Forces the has-sider class, for server rendering where a nested Sider has not registered yet */
    hasSider?: boolean;
}

export interface LayoutBasicProps {
    prefixCls?: string;
    tagName?: keyof HTMLElementTagNameMap;
    type?: string;
}

export interface SiderProps {
    prefixCls?: string;
    /** Breakpoints reported through `breakpoint`; read once at mount */
    breakpoint?: Array<keyof ResponsiveMap>;
}

export interface SiderEmits {
    breakpoint: [screen: keyof ResponsiveMap, match: boolean];
}

export interface LayoutSlots {
    default?: () => VNode[];
}

export interface LayoutContextValue {
    addSider: () => void;
    removeSider: () => void;
}
