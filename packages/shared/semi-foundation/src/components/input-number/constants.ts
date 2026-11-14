import { cssClasses as inputCssClasses, numbers as inputNumbers, strings as inputStrings } from '../input/constants';

export const cssClasses = {
    ...inputCssClasses,
};

export const numbers = {
    ...inputNumbers,
    DEFAULT_STEP: 1,
    DEFAULT_SHIFT_STEP: 10,
    DEFAULT_PRESS_TIMEOUT: 250,
    DEFAULT_PRESS_INTERVAL: 0,
    MOUSE_BUTTON_LEFT: 0,
};

export const strings = {
    ...inputStrings,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type InputNumberPart = 'input';
