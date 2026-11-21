import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-scrolllist`,
    SELECTED: `${BASE_CLASS_PREFIX}-scrolllist-item-selected`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type ScrollListPart = 'header' | 'title' | 'body' | 'footer';

/** Keys of `classNames` and `styles` on ScrollList.Item; the root element takes `className` and `style`. `selector` exists in wheel mode only */
export type ScrollListItemPart = 'list' | 'option' | 'selector';

export const numbers = {
    DEFAULT_ITEM_HEIGHT: 36,
    DEFAULT_SCROLL_DURATION: 120,
};
