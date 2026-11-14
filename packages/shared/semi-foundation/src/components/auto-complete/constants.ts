import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-autocomplete`,
    PREFIX_OPTION: `${BASE_CLASS_PREFIX}-autocomplete-option`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type AutoCompletePart = 'dropdown';
