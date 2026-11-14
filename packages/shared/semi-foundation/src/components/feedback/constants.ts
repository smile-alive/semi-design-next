import { BASE_CLASS_PREFIX } from '../../base/index';

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

/** Keys of `classNames` and `styles`; the root element takes `className` and `style`. Forwarded to the Modal or SideSheet of the current mode */
export type FeedbackPart = 'mask' | 'header' | 'body';
