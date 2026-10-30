import LayoutContentPart from './content.svelte';
import LayoutFooterPart from './footer.svelte';
import LayoutHeaderPart from './header.svelte';
import LayoutBase from './layout.svelte';
import LayoutSiderPart from './sider.svelte';

// Svelte components are functions, so the parts attach to the component itself
export const Layout: typeof LayoutBase & {
    Header: typeof LayoutHeaderPart;
    Footer: typeof LayoutFooterPart;
    Content: typeof LayoutContentPart;
    Sider: typeof LayoutSiderPart;
} = Object.assign(LayoutBase, { Header: LayoutHeaderPart, Footer: LayoutFooterPart, Content: LayoutContentPart, Sider: LayoutSiderPart });
export { default as LayoutHeader } from './header.svelte';
export { default as LayoutFooter } from './footer.svelte';
export { default as LayoutContent } from './content.svelte';
export { default as LayoutSider } from './sider.svelte';
export type { LayoutBasicProps, LayoutProps, ResponsiveMap as LayoutResponsiveMap, SiderProps } from './interface.js';
