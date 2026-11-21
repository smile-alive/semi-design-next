import { BASE_CLASS_PREFIX } from '../../base/index';

export const focusableSelector = 'input, textarea, select, button, a[href], [contenteditable], [tabindex]';

export const stepsClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-steps`,
    ITEM: `${BASE_CLASS_PREFIX}-steps-item`,
};

/** Keys of `Steps.Step`'s `classNames` and `styles`; the root element takes `className` and `style` */
export type StepPart = 'icon' | 'content' | 'title' | 'description';

/** Keys of `Steps`'s `classNames` and `styles`: `item` is each step's root, `item*` mirrors StepPart for every step */
export type StepsPart = 'item' | 'itemIcon' | 'itemContent' | 'itemTitle' | 'itemDescription';
