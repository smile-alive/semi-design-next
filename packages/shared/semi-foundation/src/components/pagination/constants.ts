import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-page`,
} as const;

/** Keys of `classNames` and `styles`; the root nav takes `className` and `style`. `item` also reaches the ellipsis button. */
export type PaginationPart = 'list' | 'total' | 'prev' | 'next' | 'item' | 'ellipsis' | 'sizeChanger' | 'sizeChangerDropdown' | 'quickJumper' | 'dropdown';

export const numbers = {
    PAGE_SHOW_MAX: 7,
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTION: [10, 20, 40, 100],
} as const;
