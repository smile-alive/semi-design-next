import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-cascader`,
    PREFIX_OPTION: `${BASE_CLASS_PREFIX}-cascader-option`,
};

export const strings = {
    SHOW_NEXT_BY_CLICK: 'click',
    SHOW_NEXT_BY_HOVER: 'hover',
    LEAF_ONLY_MERGE_TYPE: 'leafOnly',
    AUTO_MERGE_VALUE_MERGE_TYPE: 'autoMergeValue',
    NONE_MERGE_TYPE: 'none',
    SEARCH_POSITION_TRIGGER: 'trigger',
    SEARCH_POSITION_CUSTOM: 'custom',
    RELATED: 'related',
    UN_RELATED: 'unRelated',
} as const;

// Matches $height-cascader_option_list: a taller virtual list would be clipped
export const numbers = { LIST_HEIGHT: 180 };

export const VALUE_SPLIT = '_SEMI_CASCADER_SPLIT_';
