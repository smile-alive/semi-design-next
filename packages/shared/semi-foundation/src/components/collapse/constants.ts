import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-collapse`,
};

/** Keys of `classNames` and `styles` on Collapse, applied to every panel; the root element takes `className` and `style` */
export type CollapsePart = 'item' | 'itemHeader' | 'itemTitle' | 'itemIcon' | 'itemExtra' | 'itemBody';

/** Keys of `classNames` and `styles` on Collapse.Panel; the root element takes `className` and `style` */
export type CollapsePanelPart = 'header' | 'title' | 'icon' | 'extra' | 'body';
