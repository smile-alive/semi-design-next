import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: BASE_CLASS_PREFIX + '-overflow-list',
    /** The element that holds the items in scroll mode, which scrolls instead of the list root */
    SCROLL_WRAPPER: BASE_CLASS_PREFIX + '-overflow-list-scroll-wrapper',
};

/** Attribute on the first element of each scroll-mode item that carries the item's key: the observer and Tabs find items by it */
export const SCROLL_KEY_ATTRIBUTE = 'data-scrollkey';

const MODE_MAP = {
    COLLAPSE: 'collapse',
    SCROLL: 'scroll',
} as const;

const BOUNDARY_MAP = {
    START: 'start',
    END: 'end',
} as const;

export const strings = {
    POSITION_SET: ['vertical', 'horizontal'],
    MODE_MAP,
    BOUNDARY_MAP,
};

export const numbers = {
    MINIMUM_HTML_ELEMENT_WIDTH: 4,
};
