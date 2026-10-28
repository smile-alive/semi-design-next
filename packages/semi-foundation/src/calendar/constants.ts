import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-calendar`,
};

// px; an event row is 1em at $font-calendar_month_day-fontSize, the padding reserves the date header and the "more" button
export const numbers = {
    MONTH_CELL_PADDING: 60,
    MONTH_EVENT_HEIGHT: 24,
} as const;

export const strings = {
    MODE: ['day', 'week', 'month', 'range'],
} as const;
