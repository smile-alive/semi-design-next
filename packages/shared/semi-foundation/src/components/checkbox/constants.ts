import { BASE_CLASS_PREFIX } from '../../base/index';

export const checkboxClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-checkbox`,
    INPUT: `${BASE_CLASS_PREFIX}-checkbox-input`,
};

export const checkboxGroupClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-checkboxGroup`,
};

/** Keys of `Checkbox`'s `classNames` and `styles`; the root element takes `className` and `style` */
export type CheckboxPart = 'icon' | 'label' | 'extra';

/** Keys of `CheckboxGroup`'s `classNames` and `styles`; `item*` keys apply to every Checkbox in the group */
export type CheckboxGroupPart = 'item' | 'itemIcon' | 'itemLabel' | 'itemExtra';

export const strings = {
    DIRECTION_SET: ['horizontal', 'vertical'],
    TYPE_DEFAULT: 'default',
    TYPE_CARD: 'card',
    TYPE_PURECARD: 'pureCard',
    DEFAULT_DIRECTION: 'vertical',
} as const;
