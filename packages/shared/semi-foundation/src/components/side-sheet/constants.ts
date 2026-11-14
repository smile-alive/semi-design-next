import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-sidesheet`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type SideSheetPart = 'mask' | 'content' | 'header' | 'body' | 'footer';

export const strings = {
    HEIGHT: 448,
};
