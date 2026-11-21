import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-json-viewer`,
} as const;

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type JsonViewerPart = 'editor' | 'searchTrigger' | 'searchBox' | 'searchInput' | 'searchOptions' | 'replaceInput';
