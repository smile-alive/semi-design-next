import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: BASE_CLASS_PREFIX + '-overflow-list',
};

const MODE_MAP = {
    COLLAPSE: 'collapse',
    SCROLL: 'scroll',
} as const;

const BOUNDARY_MAP = {
    START: 'start',
    END: 'end',
} as const;

export const strings = {
    POSITION_SET: ['vertical', 'horizontal'],
    MODE_MAP,
    BOUNDARY_MAP,
};

export const numbers = {
    MINIMUM_HTML_ELEMENT_WIDTH: 4,
};
