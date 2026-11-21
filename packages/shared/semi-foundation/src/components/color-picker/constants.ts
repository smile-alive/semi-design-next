import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-colorPicker`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type ColorPickerPart = 'area' | 'hue' | 'alpha' | 'handle' | 'preview' | 'input' | 'format' | 'trigger' | 'dropdown';
