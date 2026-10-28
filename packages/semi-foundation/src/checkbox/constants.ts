import { BASE_CLASS_PREFIX } from '../base/constants';

export const checkboxClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-checkbox`,
    INPUT: `${BASE_CLASS_PREFIX}-checkbox-input`,
};

export const checkboxGroupClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-checkboxGroup`,
};

export const strings = {
    DIRECTION_SET: ['horizontal', 'vertical'],
    TYPE_DEFAULT: 'default',
    TYPE_CARD: 'card',
    TYPE_PURECARD: 'pureCard',
    DEFAULT_DIRECTION: 'vertical',
} as const;
