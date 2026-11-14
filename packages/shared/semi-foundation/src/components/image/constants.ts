import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-image`,
} as const;

export const numbers = {
    DEFAULT_Z_INDEX: 1070,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type ImagePart = 'img';

/** Keys of `classNames` and `styles` of an image preview; the group root takes `className` and `style` */
export type ImagePreviewPart = 'preview';
