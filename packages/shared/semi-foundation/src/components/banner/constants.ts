import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-banner`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type BannerPart = 'icon' | 'title' | 'description' | 'close' | 'extra';
