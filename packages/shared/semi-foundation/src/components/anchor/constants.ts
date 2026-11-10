import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-anchor`,
    /** On the title of the active link; the foundation measures it to place the slide bar */
    LINK_TITLE_ACTIVE: `${BASE_CLASS_PREFIX}-anchor-link-title-active`,
};

export const strings = {
    SIZE: ['small', 'default'],
    SLIDE_COLOR: ['primary', 'tertiary', 'muted'],
    MAX_WIDTH: '200px',
    MAX_HEIGHT: '750px',
} as const;
