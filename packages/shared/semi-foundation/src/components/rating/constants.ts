import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-rating`,
};

export const strings = {
    SIZE_SET: ['default', 'small'],
} as const;

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type RatingPart = 'item' | 'dropdown';
