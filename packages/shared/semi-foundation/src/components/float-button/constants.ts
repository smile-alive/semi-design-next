import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-floatButton`,
} as const;

export const cssClassesGroup = {
    PREFIX: `${BASE_CLASS_PREFIX}-floatButtonGroup`,
} as const;

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type FloatButtonPart = 'body';

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type FloatButtonGroupPart = 'item';

export const strings = {
    SHAPE: ['square', 'round'],
    SIZE: ['small', 'default', 'large'],
} as const;
