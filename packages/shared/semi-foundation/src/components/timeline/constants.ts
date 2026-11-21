import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-timeline`,
    ITEM: `${BASE_CLASS_PREFIX}-timeline-item`,
};

/** Keys of `classNames` and `styles` on Timeline; the root ul takes `className` and `style`. `item*` keys apply to every Timeline.Item, before the item's own classNames */
export type TimelinePart = 'item' | 'itemRail' | 'itemIcon' | 'itemContent' | 'itemExtra' | 'itemTime';

/** Keys of `classNames` and `styles` on Timeline.Item; the root li takes `className` and `style` */
export type TimelineItemPart = 'rail' | 'icon' | 'content' | 'extra' | 'time';
