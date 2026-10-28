import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-floatButton`,
} as const;

export const cssClassesGroup = {
    PREFIX: `${BASE_CLASS_PREFIX}-floatButtonGroup`,
} as const;

export const strings = {
    SHAPE: ['square', 'round'],
    SIZE: ['small', 'default', 'large'],
} as const;
