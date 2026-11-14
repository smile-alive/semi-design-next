import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-input`,
} as const;

export const strings = {
    SIZE: ['small', 'large', 'default'],
    DEFAULT_SIZE: 'default',
} as const;

export const numbers = {};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type InputPart = 'input';

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type TextAreaPart = 'textarea' | 'lineNumber';
