import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-tagInput`,
} as const;

/** Keys of `classNames` and `styles`; the root element takes `className` and `style`. `input` lands on the native input of the inner Input */
export type TagInputPart = 'prefix' | 'suffix' | 'content' | 'tag' | 'input' | 'clear';

export const strings = {
    SIZE_SET: ['large', 'default', 'small'],
} as const;
