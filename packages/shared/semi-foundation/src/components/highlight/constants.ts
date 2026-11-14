import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-highlight`,
} as const;

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type HighlightPart = 'highlight';
