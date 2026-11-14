import { VALIDATE_STATUS, BASE_CLASS_PREFIX } from '../../base/index';
import { strings as tooltipStrings } from '../tooltip/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-select`,
    PREFIX_OPTION: `${BASE_CLASS_PREFIX}-select-option`,
    PREFIX_GROUP: `${BASE_CLASS_PREFIX}-select-group`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type SelectPart = 'dropdown';

export const strings = {
    SIZE_SET: ['small', 'large', 'default'],
    POSITION_SET: tooltipStrings.POSITION_SET,
    STATUS: VALIDATE_STATUS,
    SEARCH_POSITION_TRIGGER: 'trigger',
    SEARCH_POSITION_DROPDOWN: 'dropdown',
} as const;

export const numbers = { LIST_HEIGHT: 270 };
