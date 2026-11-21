import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-breadcrumb`,
};

export const DEFAULT_TOOLTIP = { width: 150, ellipsisPos: 'end' } as const;

/** Keys of `classNames` and `styles` on Breadcrumb; the root nav takes `className` and `style` */
export type BreadcrumbPart = 'list' | 'item' | 'itemLink' | 'itemIcon' | 'itemTitle' | 'separator' | 'more';

/** Keys of `classNames` and `styles` on Breadcrumb.Item; the root li takes `className` and `style` */
export type BreadcrumbItemPart = 'link' | 'icon' | 'title' | 'separator';
