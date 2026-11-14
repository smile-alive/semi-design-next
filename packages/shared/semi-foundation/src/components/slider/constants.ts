import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-slider`,
    VERTICAL: `${BASE_CLASS_PREFIX}-slider-vertical`,
    TRACK: `${BASE_CLASS_PREFIX}-slider-track`,
    DOTS: `${BASE_CLASS_PREFIX}-slider-dots`,
    MARKS: `${BASE_CLASS_PREFIX}-slider-marks`,
    HANDLE: `${BASE_CLASS_PREFIX}-slider-handle`,
    HANDLE_DOT: `${BASE_CLASS_PREFIX}-slider-handle-dot`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type SliderPart = 'rail';
