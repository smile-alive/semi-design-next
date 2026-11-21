import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-userGuide`,
    PREFIX_MODAL: `${BASE_CLASS_PREFIX}-userGuide-modal`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style`. `indicators` exists only in modal mode with a cover */
export type UserGuidePart = 'cover' | 'body' | 'title' | 'description' | 'progress' | 'indicators' | 'footer';

export const numbers = {
    DEFAULT_CURRENT: 0,
    DEFAULT_SPOTLIGHT_PADDING: 5,
    DEFAULT_Z_INDEX: 1030,
};
