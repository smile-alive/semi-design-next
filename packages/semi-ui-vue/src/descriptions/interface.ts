import type { StyleValue, VNode } from 'vue';

export type DescriptionsAlign = 'center' | 'justify' | 'left' | 'plain';
export type DescriptionsLayout = 'horizontal' | 'vertical';
export type DescriptionsSize = 'small' | 'medium' | 'large';

/** An item of `data`; nodes for its key and value come from the Descriptions slots */
export interface DescriptionsData {
    key?: string | number;
    value?: string | number;
    hidden?: boolean;
    span?: number;
    keyStyle?: StyleValue;
}

export interface DescriptionsProps {
    align?: DescriptionsAlign;
    row?: boolean;
    size?: DescriptionsSize;
    data?: DescriptionsData[];
    layout?: DescriptionsLayout;
    column?: number;
}

export interface DescriptionsSlotProps {
    item: DescriptionsData;
    /** Position in `data`, hidden items included */
    index: number;
}

export interface DescriptionsSlots {
    /** Descriptions.Item children, used when data is empty */
    default?: () => VNode[];
    /** Key of each data item; defaults to `item.key` */
    itemKey?: (props: DescriptionsSlotProps) => VNode[];
    /** Value of each data item; defaults to `item.value` */
    value?: (props: DescriptionsSlotProps) => VNode[];
}

export interface DescriptionsItemProps {
    hidden?: boolean;
    span?: number;
    keyStyle?: StyleValue;
}

export interface DescriptionsItemSlots {
    /** The value */
    default?: () => VNode[];
    itemKey?: () => VNode[];
}
