import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-feedback`,
} as const;

export const strings = {
    MODE: ['modal', 'popup'],
    TYPE: ['text', 'emoji', 'radio', 'checkbox', 'custom'],
    Emoji: {
        bad: '😞',
        normal: '😐',
        good: '😃',
    },
} as const;
