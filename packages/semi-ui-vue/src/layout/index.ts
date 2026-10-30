import LayoutContent from './content.vue';
import LayoutFooter from './footer.vue';
import LayoutHeader from './header.vue';
import LayoutRoot from './layout.vue';
import LayoutSider from './sider.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
export const Layout: typeof LayoutRoot & {
    Header: typeof LayoutHeader;
    Footer: typeof LayoutFooter;
    Content: typeof LayoutContent;
    Sider: typeof LayoutSider;
} = Object.assign(LayoutRoot, {
    Header: LayoutHeader,
    Footer: LayoutFooter,
    Content: LayoutContent,
    Sider: LayoutSider,
});
export default Layout;
export { default as LayoutHeader } from './header.vue';
export { default as LayoutFooter } from './footer.vue';
export { default as LayoutContent } from './content.vue';
export { default as LayoutSider } from './sider.vue';
export type * from './interface';
