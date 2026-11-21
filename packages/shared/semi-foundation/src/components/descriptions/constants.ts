import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-descriptions`,
};

/** Keys of `classNames` and `styles` on Descriptions; `item*` keys apply to every item. The root element takes `className` and `style` */
export type DescriptionsPart = 'itemKey' | 'itemValue';

/** Keys of `classNames` and `styles` on Descriptions.Item and on `data` entries */
export type DescriptionsItemPart = 'key' | 'value';
