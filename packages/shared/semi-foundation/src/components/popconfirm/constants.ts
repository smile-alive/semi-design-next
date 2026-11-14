import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-popconfirm`,
    POPOVER: `${BASE_CLASS_PREFIX}-popconfirm-popover`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type PopconfirmPart = 'content' | 'arrow';
