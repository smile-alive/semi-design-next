import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-tagInput`,
} as const;

/** Keys of `classNames` and `styles`; the root element takes `className` and `style`. `input` lands on the root element of the inner Input, not on the native input */
export type TagInputPart = 'prefix' | 'suffix' | 'content' | 'tag' | 'input' | 'clear';

export const strings = {
    SIZE_SET: ['large', 'default', 'small'],
} as const;
