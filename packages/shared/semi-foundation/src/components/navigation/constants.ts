import { BASE_CLASS_PREFIX } from '../../base/index';

const MODE_HORIZONTAL = 'horizontal';
const MODE_VERTICAL = 'vertical';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-navigation`,
};

/**
 * Keys of `classNames` and `styles` of Nav; the root element takes `className` and `style`. The `item*` and `subNav*`
 * keys apply to every item and sub nav below, `itemIcon`, `itemText` and `itemToggleIcon` also to the title of a sub nav.
 * Nav.Header and Nav.Footer have their own `classNames`, also when given through `header` and `footer`.
 */
export type NavPart = 'body' | 'list' | 'item' | 'itemIcon' | 'itemText' | 'itemToggleIcon' | 'subNav' | 'subNavTitle' | 'subNavList' | 'subNavDropdown';

/** Keys of `classNames` and `styles` of Nav.Item; the root element takes `className` and `style` */
export type NavItemPart = 'icon' | 'text' | 'toggleIcon';

/** Keys of `classNames` and `styles` of SubNav; the root element takes `className` and `style` */
export type SubNavPart = 'title' | 'icon' | 'text' | 'toggleIcon' | 'list' | 'dropdown';

/** Keys of `classNames` and `styles` of Nav.Header; the root element takes `className` and `style` */
export type NavHeaderPart = 'logo' | 'text' | 'link';

/** Keys of `classNames` and `styles` of Nav.Footer; the root element takes `className` and `style` */
export type NavFooterPart = 'collapseButton';

export const strings = {
    MODE_VERTICAL,
    MODE_HORIZONTAL,
    ICON_POS_LEFT: 'left',
    ICON_POS_RIGHT: 'right',
    TOGGLE_ICON_LEFT: 'left',
    TOGGLE_ICON_RIGHT: 'right',
};

export const numbers = {
    DEFAULT_TOOLTIP_SHOW_DELAY: 0, // ms
    DEFAULT_TOOLTIP_HIDE_DELAY: 100, // ms
    DEFAULT_SUBNAV_OPEN_DELAY: 0, // ms
    DEFAULT_SUBNAV_CLOSE_DELAY: 100, // ms
};
