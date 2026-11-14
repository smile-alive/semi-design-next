import { VALIDATE_STATUS, BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-tree-select`,
    PREFIX_TREE: `${BASE_CLASS_PREFIX}-tree`,
    PREFIX_OPTION: `${BASE_CLASS_PREFIX}-tree-select-option`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type TreeSelectPart = 'dropdown' | 'optionList';

export const strings = {
    SIZE_SET: ['small', 'large', 'default'],
    SEARCH_POSITION_DROPDOWN: 'dropdown',
    SEARCH_POSITION_TRIGGER: 'trigger',
    STATUS: VALIDATE_STATUS,
} as const;
