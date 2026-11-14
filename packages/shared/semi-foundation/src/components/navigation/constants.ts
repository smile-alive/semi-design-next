import { BASE_CLASS_PREFIX } from '../../base/index';

const MODE_HORIZONTAL = 'horizontal';
const MODE_VERTICAL = 'vertical';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-navigation`,
};

/** Keys of `classNames` and `styles` of Nav; the root element takes `className` and `style` */
export type NavPart = 'body';

/** Keys of `classNames` and `styles` of SubNav; the root element takes `className` and `style` */
export type SubNavPart = 'dropdown';

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
