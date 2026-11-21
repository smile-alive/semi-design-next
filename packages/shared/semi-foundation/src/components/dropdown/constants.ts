import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-dropdown`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type DropdownPart = 'content' | 'wrapper' | 'menu' | 'item' | 'itemIcon';

/** Keys of `classNames` and `styles` of Dropdown.Item */
export type DropdownItemPart = 'icon';

/** The parts a Dropdown hands down to the menu and items it renders */
export type DropdownMenuPart = Extract<DropdownPart, 'menu' | 'item' | 'itemIcon'>;

export const strings = {
    DEFAULT_LEAVE_DELAY: 100,
    ITEM_SELECTOR: '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
};

export const numbers = {
    SPACING: 4,
    NESTED_SPACING: 2,
};
