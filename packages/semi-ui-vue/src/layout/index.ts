import LayoutContent from './content.vue';
import LayoutFooter from './footer.vue';
import LayoutHeader from './header.vue';
import LayoutRoot from './layout.vue';
import LayoutSider from './sider.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
const Layout: typeof LayoutRoot & {
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
export { Layout, LayoutHeader, LayoutFooter, LayoutContent, LayoutSider };
export type * from './interface';
