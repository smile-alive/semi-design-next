import type { JSX } from 'solid-js';
import type { ElementProps } from '../_base/element-props';

export type DescriptionsAlign = 'center' | 'justify' | 'left' | 'plain';
export type DescriptionsLayout = 'horizontal' | 'vertical';
export type DescriptionsSize = 'small' | 'medium' | 'large';

/** An item of `data`; nodes for its key and value come from `renderKey` and `renderValue` */
export interface Data {
    key?: string | number;
    value?: string | number;
    hidden?: boolean;
    span?: number;
    keyStyle?: JSX.CSSProperties | string;
}

export interface DescriptionsProps extends ElementProps<'div'> {
    align?: DescriptionsAlign;
    row?: boolean;
    size?: DescriptionsSize;
    data?: Data[];
    layout?: DescriptionsLayout;
    column?: number;
    /** Key of each data item, called only for shown items; `index` counts hidden items too. Defaults to `item.key` */
    renderKey?: (item: Data, index: number) => JSX.Element;
    /** Value of each data item, called only for shown items; `index` counts hidden items too. Defaults to `item.value` */
    renderValue?: (item: Data, index: number) => JSX.Element;
}

export interface DescriptionsItemProps extends ElementProps<'tr', 'children'> {
    /** A function is called when rendered */
    children?: JSX.Element | (() => JSX.Element);
    hidden?: boolean;
    itemKey?: JSX.Element;
    span?: number;
    keyStyle?: JSX.CSSProperties | string;
}
