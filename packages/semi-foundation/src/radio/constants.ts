import { BASE_CLASS_PREFIX } from '../base/constants';

export const radioClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-radio`,
} as const;

export const radioGroupClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-radioGroup`,
} as const;

export const strings = {
    DIRECTION_SET: ['horizontal', 'vertical'],
    DEFAULT_DIRECTION: 'horizontal',
    MODE: ['advanced', ''],
    TYPE_DEFAULT: 'default',
    TYPE_BUTTON: 'button',
    TYPE_CARD: 'card',
    TYPE_PURECARD: 'pureCard',
    BUTTON_SIZE: ['middle', 'small', 'large'],
} as const;
