import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-transfer`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type TransferPart = 'source' | 'selected' | 'filter' | 'header' | 'title' | 'action' | 'list' | 'groupTitle' | 'item' | 'itemDragHandle' | 'itemRemove' | 'empty';

export const strings = {
    TYPE_GROUP_LIST: 'groupList',
    TYPE_LIST: 'list',
    TYPE_TREE_TO_LIST: 'treeList',
    PATH_SEPARATOR: ' > ',
};

export const numbers = {
    DEFAULT_PAGE_SIZE: 10,
};
