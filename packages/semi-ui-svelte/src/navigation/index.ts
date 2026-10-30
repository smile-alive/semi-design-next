import NavFooterPart from './nav-footer.svelte';
import NavHeaderPart from './nav-header.svelte';
import NavItemPart from './nav-item.svelte';
import NavBase from './nav.svelte';
import SubNavPart from './sub-nav.svelte';

// Svelte components are functions, so the parts attach to the component itself
export const Nav: typeof NavBase & {
    Sub: typeof SubNavPart;
    Item: typeof NavItemPart;
    Header: typeof NavHeaderPart;
    Footer: typeof NavFooterPart;
} = Object.assign(NavBase, { Sub: SubNavPart, Item: NavItemPart, Header: NavHeaderPart, Footer: NavFooterPart });
export { default as NavFooter } from './nav-footer.svelte';
export { default as NavHeader } from './nav-header.svelte';
export { default as NavItem } from './nav-item.svelte';
export { default as SubNav } from './sub-nav.svelte';
export type {
    NavClickData,
    NavExpandIconArgs,
    NavFooterConfig,
    NavFooterProps,
    NavHeaderConfig,
    NavHeaderProps,
    NavIconArgs,
    NavItemConfig,
    NavItemProps,
    NavItemRenderProps,
    NavItems,
    NavLinkOptions,
    NavOpenChangeData,
    NavProps,
    NavWrapperArgs,
    OnSelectedData as NavOnSelectedData,
    ItemKey as NavItemKey,
    Mode as NavMode,
    SelectedData as NavSelectedData,
    SubDropdownProps as SubNavDropdownProps,
    SubNavProps,
} from './interface.js';
