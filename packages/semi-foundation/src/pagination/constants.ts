import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-page`,
} as const;

export const numbers = {
    PAGE_SHOW_MAX: 7,
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTION: [10, 20, 40, 100],
} as const;
