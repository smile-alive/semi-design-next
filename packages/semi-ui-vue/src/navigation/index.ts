import NavFooter from './nav-footer.vue';
import NavHeader from './nav-header.vue';
import NavItem from './nav-item.vue';
import Nav from './nav.vue';
import SubNav from './sub-nav.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
const NavWithParts: typeof Nav & {
    Item: typeof NavItem;
    Sub: typeof SubNav;
    Header: typeof NavHeader;
    Footer: typeof NavFooter;
} = Object.assign(Nav, { Item: NavItem, Sub: SubNav, Header: NavHeader, Footer: NavFooter });
export default NavWithParts;
export { default as NavItem } from './nav-item.vue';
export { default as SubNav } from './sub-nav.vue';
export { default as NavHeader } from './nav-header.vue';
export { default as NavFooter } from './nav-footer.vue';
export type * from './interface';
