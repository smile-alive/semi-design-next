import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    DIALOG: `${BASE_CLASS_PREFIX}-modal`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type ModalPart = 'mask' | 'content' | 'header' | 'body' | 'footer';
