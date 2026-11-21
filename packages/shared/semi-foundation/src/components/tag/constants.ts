import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-tag`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type TagPart = 'prefix' | 'avatar' | 'content' | 'suffix' | 'close';

export const strings = {
    TAG_SIZE: ['default', 'small', 'large'],
    TAG_COLOR: ['grey', 'red', 'pink', 'purple', 'violet', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'white'],
    TAG_TYPE: ['light', 'solid', 'ghost'],
} as const;
