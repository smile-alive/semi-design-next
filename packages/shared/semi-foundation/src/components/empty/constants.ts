import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-empty`,
} as const;

export const strings = {
    LAYOUT: ['vertical', 'horizontal'],
} as const;

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type EmptyPart = 'image';
