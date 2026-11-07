import Footer from './footer';
import Header from './header';
import Item from './item';
import Nav from './nav';
import Sub from './sub-nav';

export type { CollapseButtonProps, ItemKey, Mode, NavFooterConfig, NavFooterProps, NavHeaderConfig, NavHeaderProps, NavItemConfig, NavItemProps, NavItemRenderProps, NavItems, NavProps, OnClickData, OnOpenChangeData, OnSelectedData, RenderWrapperData, SelectedData, SubNavProps } from './interface';

export default Object.assign(Nav, { Sub, Item, Header, Footer });
