import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-avatar`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type AvatarPart = 'image' | 'label' | 'mask' | 'border';

/** Keys of `classNames` and `styles` on AvatarGroup; the root element takes `className` and `style` */
export type AvatarGroupPart = 'more';

export const strings = {
    SIZE: ['extra-extra-small', 'extra-small', 'small', 'default', 'medium', 'large', 'extra-large'],
} as const;
