import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-list`,
};

/** Keys of `classNames` and `styles` on List; the root div takes `className` and `style`. `item*` keys apply to every List.Item, before the item's own classNames */
export type ListPart = 'header' | 'footer' | 'empty' | 'item' | 'itemHeader' | 'itemMain' | 'itemExtra';

/** Keys of `classNames` and `styles` on List.Item; the root li takes `className` and `style` */
export type ListItemPart = 'header' | 'main' | 'extra';
