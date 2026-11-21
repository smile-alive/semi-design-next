import { BASE_CLASS_PREFIX } from '../../base/index';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-tree`,
    PREFIX_OPTION: `${BASE_CLASS_PREFIX}-tree-option`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type TreePart = 'search' | 'list' | TreeNodePart;

/** The parts rendered by a tree row, which Tree and TreeSelect share */
export type TreeNodePart = 'empty' | 'item' | 'itemSwitcher' | 'itemCheckbox' | 'itemIcon' | 'itemTitle';

export const strings = {
    JSON_KEY_SPLIT: '_SEMI_TREE_SPLIT_',
};
