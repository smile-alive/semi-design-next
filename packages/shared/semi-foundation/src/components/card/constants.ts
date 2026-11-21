import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-card`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type CardPart = 'header' | 'title' | 'extra' | 'cover' | 'body' | 'actions' | 'footer';

/** Keys of `classNames` and `styles` on Card.Meta; the root element takes `className` and `style` */
export type CardMetaPart = 'avatar' | 'section' | 'title' | 'description';
