import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-dropdown`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type DropdownPart = 'content' | 'wrapper';

export const strings = {
    DEFAULT_LEAVE_DELAY: 100,
    ITEM_SELECTOR: '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
};

export const numbers = {
    SPACING: 4,
    NESTED_SPACING: 2,
};
