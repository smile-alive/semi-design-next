import type { StyleValue, VNode } from 'vue';

export type DescriptionsAlign = 'center' | 'justify' | 'left' | 'plain';
export type DescriptionsLayout = 'horizontal' | 'vertical';
export type DescriptionsSize = 'small' | 'medium' | 'large';

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
    default?: () => VNode[];
    itemKey?: (props: DescriptionsSlotProps) => VNode[];
    value?: (props: DescriptionsSlotProps) => VNode[];
}

export interface DescriptionsItemProps {
    hidden?: boolean;
    span?: number;
    keyStyle?: StyleValue;
}

export interface DescriptionsItemSlots {
    default?: () => VNode[];
    itemKey?: () => VNode[];
}
