import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-progress`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style`. `rail` is the full-length groove, `track` the completed part (the reverse of the `semi-progress-track` class naming) */
export type ProgressPart = 'rail' | 'track' | 'text';

export const strings = {
    STROKE_DEFAULT: 'var(--semi-color-success)',
    DEFAULT_DIRECTION: 'horizontal',
};
