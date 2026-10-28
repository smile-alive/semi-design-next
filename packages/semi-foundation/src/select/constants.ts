import { VALIDATE_STATUS, BASE_CLASS_PREFIX } from '../base/constants';
import { strings as tooltipStrings } from '../tooltip/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-select`,
    PREFIX_OPTION: `${BASE_CLASS_PREFIX}-select-option`,
    PREFIX_GROUP: `${BASE_CLASS_PREFIX}-select-group`,
};

export const strings = {
    SIZE_SET: ['small', 'large', 'default'],
    POSITION_SET: tooltipStrings.POSITION_SET,
    STATUS: VALIDATE_STATUS,
    SEARCH_POSITION_TRIGGER: 'trigger',
    SEARCH_POSITION_DROPDOWN: 'dropdown',
} as const;

export const numbers = { LIST_HEIGHT: 270 };
