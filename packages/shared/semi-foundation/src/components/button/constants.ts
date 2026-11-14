import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-button`,
};

export const strings = {
    DEFAULT_ICON_POSITION: 'left',
} as const;

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type ButtonPart = 'content';
