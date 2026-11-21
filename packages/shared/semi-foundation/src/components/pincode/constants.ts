import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-pincode`,
} as const;

/** Keys of `classNames` and `styles`; the root element takes `className` and `style`. `input` lands on the native input of every cell */
export type PinCodePart = 'input';
